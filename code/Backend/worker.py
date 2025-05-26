#!/usr/bin/env python3
import os
import time
import json
import requests
from utils.db_models import SessionLocal, PendingBook, Book, AppLog
from setup.build_index import add_to_index

# Directories and constants
BASE_DIR = os.path.dirname(__file__)
COVERS_DIR = os.path.join(BASE_DIR, "data/covers")
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "data"))
INDEX_PATH = os.path.join(DATA_DIR, "index.faiss")
NAMES_PATH = os.path.join(DATA_DIR, "image_names.json")
CHECK_INTERVAL = 5  # seconds between queue polls

# Amazon CDN URL patterns for ISBN-10 (ASIN)
AMAZON_COVER_PATTERNS = [
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SCLZZZZZZZ_.jpg",
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SX200_.jpg",
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SX300_.jpg",
]
# OpenLibrary covers URL template
OL_COVER_TEMPLATE = "https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false"
# Google Books content endpoint template
GB_CONTENT_TEMPLATE = (
    "https://books.google.com/books/content"
    "?id={google_id}&printsec=frontcover&img=1&zoom=1&source=gbs_api"
)

# Ensure cover directory exists
os.makedirs(COVERS_DIR, exist_ok=True)


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log an application event to the database and console.
    """
    session = SessionLocal()
    session.add(AppLog(level=level, message=message, context=context))
    session.commit()
    session.close()
    print(f"[{level}] {message}")


def http_get_json(url: str, params: dict = None, timeout: int = 10) -> dict:
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def fetch_google_books_data(isbn13: str) -> dict:
    data = http_get_json(
        "https://www.googleapis.com/books/v1/volumes",
        params={"q": f"isbn:{isbn13}"}
    )
    items = data.get("items") or []
    if not items:
        raise Exception("Book not found on Google Books")
    vol = items[0]
    info = vol.get("volumeInfo", {})
    isbn10 = next((i["identifier"] for i in info.get("industryIdentifiers", []) if i.get("type")=="ISBN_10"), None)
    return {
        "isbn": isbn10,
        "isbn13": isbn13,
        "title": info.get("title"),
        "authors": info.get("authors", []),
        "pages": info.get("pageCount"),
        "publication_date": info.get("publishedDate"),
        "publisher": info.get("publisher"),
        "language_code": info.get("language"),
        "cover_url": info.get("imageLinks", {}).get("thumbnail"),
        "description": info.get("description"),
        "genres": info.get("categories", []),
        "average_rating": info.get("averageRating"),
        "rating_count": info.get("ratingsCount"),
        "external_links": [info.get("infoLink")],
        "google_id": vol.get("id"),
    }


def fetch_openlibrary_data(isbn13: str) -> dict:
    data = http_get_json(
        "https://openlibrary.org/api/books",
        params={"bibkeys": f"ISBN:{isbn13}", "format": "json", "jscmd": "data"}
    )
    record = data.get(f"ISBN:{isbn13}")
    if not record:
        raise Exception("Book not found on OpenLibrary")
    isbn10 = record.get("identifiers", {}).get("isbn_10", [None])[0]
    return {
        "isbn": isbn10,
        "isbn13": isbn13,
        "title": record.get("title"),
        "authors": [a.get("name") for a in record.get("authors", [])],
        "pages": record.get("number_of_pages"),
        "publication_date": record.get("publish_date"),
        "publisher": record.get("publishers", [{}])[0].get("name"),
        "language_code": (record.get("languages", [{}])[0].get("key", "").split("/")[-1] if record.get("languages") else None),
        "cover_url": (record.get("cover", {}).get("large") or record.get("cover", {}).get("medium") or record.get("cover", {}).get("small")),
        "external_links": [l.get("url") for l in record.get("links", [])],
        "description": (record.get("description", {}).get("value") if isinstance(record.get("description"), dict) else record.get("description")),
        "genres": [(s.get("name") if isinstance(s, dict) else s) for s in record.get("subjects", [])],
        "average_rating": None,
        "rating_count": None,
    }


def download_cover(isbn10: str, isbn13: str, cover_url: str = None, google_id: str = None) -> str:
    if not isbn10:
        print("[WARNING] No ISBN-10, skipping cover download.")
        return None
    candidates = [p.format(isbn10=isbn10) for p in AMAZON_COVER_PATTERNS]
    if google_id:
        candidates.append(GB_CONTENT_TEMPLATE.format(google_id=google_id))
    candidates.append(OL_COVER_TEMPLATE.format(isbn13=isbn13))
    dest = os.path.join(COVERS_DIR, f"{isbn10}.jpg")
    for url in candidates:
        try:
            head = requests.head(url, timeout=5)
            if head.status_code==200 and head.headers.get("Content-Type", "").startswith("image"):
                resp = requests.get(url, timeout=10); resp.raise_for_status()
                with open(dest, "wb") as f: f.write(resp.content)
                print(f"[SUCCESS] Cover downloaded: {dest}")
                return dest
        except requests.RequestException:
            continue
    print("[WARNING] Failed to download cover from all sources.")
    return None


def fetch_book_data(isbn13: str) -> dict:
    try:
        return fetch_google_books_data(isbn13)
    except Exception as e:
        log_app("WARNING", f"Google Books lookup failed for {isbn13}: {e}")
        return fetch_openlibrary_data(isbn13)


def upsert_book(session, metadata: dict) -> None:
    book_obj = Book(**{k: metadata[k] for k in metadata if k in {c.name for c in Book.__table__.columns}})
    session.merge(book_obj)
    print(f"[SUCCESS] DB upsert for ISBN13: {metadata.get('isbn13')}")

def process_pending_books() -> None:
    while True:
        with SessionLocal() as session:
            pendings = session.query(PendingBook).all()
            if not pendings:
                time.sleep(CHECK_INTERVAL)
            else:
                for entry in pendings:
                    isbn13 = entry.isbn
                    log_app("INFO", f"Processing ISBN13: {isbn13}")
                    try:
                        meta = fetch_book_data(isbn13)
                        log_app("SUCCESS", f"Fetched metadata for {isbn13}")
                    except Exception as e:
                        log_app("ERROR", f"Metadata fetch failed for {isbn13}: {e}")
                        continue

                    isbn10 = meta.get("isbn")
                    try:
                        cover_path = download_cover(isbn10, isbn13, cover_url=meta.get("cover_url"), google_id=meta.get("google_id"))
                        if cover_path:
                            log_app("SUCCESS", f"Cover saved at {cover_path}")
                    except Exception as e:
                        log_app("WARNING", f"Cover download error for {isbn10}: {e}")

                    try:
                        add_to_index(isbn10)
                        log_app("SUCCESS", f"Indexed {isbn10}")
                    except Exception as e:
                        log_app("ERROR", f"Indexing failed for {isbn10}: {e}")

                    try:
                        upsert_book(session, meta)
                        session.commit()
                        session.delete(entry)
                        session.commit()
                        log_app("SUCCESS", f"Completed processing for {isbn13}")
                    except Exception as e:
                        session.rollback()
                        log_app("ERROR", f"DB upsert/delete failed for {isbn13}: {e}")
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    log_app("INFO", "Worker started - monitoring pending books...")
    process_pending_books()
