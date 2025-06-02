#!/usr/bin/env python3
"""
Book Processing Worker

This worker continuously monitors the pending_books queue and processes new book requests.
For each pending book, it:
1. Fetches metadata from Google Books API or OpenLibrary
2. Downloads book cover images from multiple sources
3. Adds the book cover to the FAISS search index
4. Stores the book data in the database

The worker handles failures gracefully by marking books as "stuck" for manual review.
"""

import os
import time
import json
import requests
from utils.db_models import SessionLocal, PendingBook, Book, AppLog, ScanLog
from setup.build_index import add_to_index

# Configuration constants
BASE_DIR = os.path.dirname(__file__)
COVERS_DIR = os.path.join(BASE_DIR, "data/covers")
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "data"))
INDEX_PATH = os.path.join(DATA_DIR, "index.faiss")
NAMES_PATH = os.path.join(DATA_DIR, "image_names.json")
CHECK_INTERVAL = 2  # seconds between queue polls

# Cover image source URLs (in priority order)
AMAZON_COVER_PATTERNS = [
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SCLZZZZZZZ_.jpg",
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SX200_.jpg",
    "https://images-na.ssl-images-amazon.com/images/P/{isbn10}.01._SX300_.jpg",
]
OL_COVER_TEMPLATE = "https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false"
GB_CONTENT_TEMPLATE = (
    "https://books.google.com/books/content"
    "?id={google_id}&printsec=frontcover&img=1&zoom=1&source=gbs_api"
)

# Ensure cover directory exists
os.makedirs(COVERS_DIR, exist_ok=True)


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log application events to database and console.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
        message: Human-readable log message
        context: Optional additional context data
    """
    session = SessionLocal()
    session.add(AppLog(level=level, message=message, context=context))
    session.commit()
    session.close()
    print(f"[{level}] {message}")


def http_get_json(url: str, params: dict = None, timeout: int = 10) -> dict:
    """
    Make HTTP GET request and parse JSON response.
    
    Args:
        url: Target URL
        params: Optional query parameters
        timeout: Request timeout in seconds
        
    Returns:
        Parsed JSON response as dictionary
        
    Raises:
        requests.RequestException: On HTTP errors
    """
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def fetch_google_books_data(isbn13: str) -> dict:
    """
    Fetch book metadata from Google Books API.
    
    Args:
        isbn13: 13-digit ISBN to search for
        
    Returns:
        Standardized book metadata dictionary
        
    Raises:
        Exception: If book not found or API error
    """
    data = http_get_json(
        "https://www.googleapis.com/books/v1/volumes",
        params={"q": f"isbn:{isbn13}"}
    )
    
    items = data.get("items") or []
    if not items:
        raise Exception("Book not found on Google Books")
    
    vol = items[0]
    info = vol.get("volumeInfo", {})
    
    # Extract ISBN-10 from industry identifiers
    isbn10 = next(
        (i["identifier"] for i in info.get("industryIdentifiers", []) 
         if i.get("type") == "ISBN_10"), 
        None
    )
    
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
    """
    Fetch book metadata from OpenLibrary API as fallback.
    
    Args:
        isbn13: 13-digit ISBN to search for
        
    Returns:
        Standardized book metadata dictionary
        
    Raises:
        Exception: If book not found or API error
    """
    data = http_get_json(
        "https://openlibrary.org/api/books",
        params={"bibkeys": f"ISBN:{isbn13}", "format": "json", "jscmd": "data"}
    )
    
    record = data.get(f"ISBN:{isbn13}")
    if not record:
        raise Exception("Book not found on OpenLibrary")
    
    # Extract ISBN-10 if available
    isbn10 = record.get("identifiers", {}).get("isbn_10", [None])[0]
    
    # Extract language code from OpenLibrary format
    language_code = None
    if record.get("languages"):
        lang_key = record.get("languages", [{}])[0].get("key", "")
        language_code = lang_key.split("/")[-1] if lang_key else None
    
    # Handle description field (can be string or dict)
    description = record.get("description")
    if isinstance(description, dict):
        description = description.get("value")
    
    return {
        "isbn": isbn10,
        "isbn13": isbn13,
        "title": record.get("title"),
        "authors": [a.get("name") for a in record.get("authors", [])],
        "pages": record.get("number_of_pages"),
        "publication_date": record.get("publish_date"),
        "publisher": record.get("publishers", [{}])[0].get("name"),
        "language_code": language_code,
        "cover_url": (record.get("cover", {}).get("large") or 
                     record.get("cover", {}).get("medium") or 
                     record.get("cover", {}).get("small")),
        "external_links": [l.get("url") for l in record.get("links", [])],
        "description": description,
        "genres": [(s.get("name") if isinstance(s, dict) else s) 
                  for s in record.get("subjects", [])],
        "average_rating": None,
        "rating_count": None,
    }


def download_cover(isbn10: str, isbn13: str, cover_url: str = None, google_id: str = None) -> str:
    """
    Download book cover from multiple sources in priority order.
    
    Sources tried in order:
    1. Amazon CDN (multiple sizes)
    2. Google Books content API (if google_id provided)
    3. OpenLibrary covers
    
    Args:
        isbn10: 10-digit ISBN for filename
        isbn13: 13-digit ISBN for OpenLibrary
        cover_url: Optional direct cover URL
        google_id: Optional Google Books volume ID
        
    Returns:
        Path to downloaded cover file, or None if all sources fail
    """
    if not isbn10:
        print("[WARNING] No ISBN-10, skipping cover download.")
        return None
    
    # Build candidate URLs in priority order
    candidates = [p.format(isbn10=isbn10) for p in AMAZON_COVER_PATTERNS]
    
    if google_id:
        candidates.append(GB_CONTENT_TEMPLATE.format(google_id=google_id))
    
    candidates.append(OL_COVER_TEMPLATE.format(isbn13=isbn13))
    
    dest = os.path.join(COVERS_DIR, f"{isbn10}.jpg")
    
    # Try each URL until one works
    for url in candidates:
        try:
            # Check if URL returns valid image before downloading
            head = requests.head(url, timeout=5)
            if (head.status_code == 200 and 
                head.headers.get("Content-Type", "").startswith("image")):
                
                # Download the actual image
                resp = requests.get(url, timeout=10)
                resp.raise_for_status()
                
                with open(dest, "wb") as f:
                    f.write(resp.content)
                
                print(f"[SUCCESS] Cover downloaded: {dest}")
                return dest
                
        except requests.RequestException:
            # Try next URL on any HTTP error
            continue
    
    print("[WARNING] Failed to download cover from all sources.")
    return None


def fetch_book_data(isbn13: str) -> dict:
    """
    Fetch book metadata with Google Books as primary, OpenLibrary as fallback.
    
    Args:
        isbn13: 13-digit ISBN to search for
        
    Returns:
        Standardized book metadata dictionary
        
    Raises:
        Exception: If book not found in any source
    """
    try:
        return fetch_google_books_data(isbn13)
    except Exception as e:
        log_app("WARNING", f"Google Books lookup failed for {isbn13}: {e}")
        return fetch_openlibrary_data(isbn13)


def log_scan(isbn: str, status: str, message: str, extra: dict = None) -> None:
    """
    Log scan events for tracking and analytics.
    
    Args:
        isbn: Book ISBN being processed
        status: Processing status (success, error, pending)
        message: Human-readable status message
        extra: Optional additional context data
    """
    session = SessionLocal()
    scan_log = ScanLog(isbn=isbn, status=status, message=message, extra=extra)
    session.add(scan_log)
    session.commit()
    session.close()


def process_pending_books() -> None:
    """
    Main worker loop that continuously processes pending books.
    
    This function runs indefinitely, checking for new pending books every
    CHECK_INTERVAL seconds. For each book found:
    1. Fetches metadata from external APIs
    2. Downloads cover image
    3. Adds cover to search index
    4. Saves book to database
    5. Removes from pending queue
    
    Books that fail processing are marked as "stuck" for manual review.
    """
    while True:
        with SessionLocal() as session:
            # Get all non-stuck pending books
            pendings = session.query(PendingBook).filter_by(stucked=False).all()
            
            if not pendings:
                time.sleep(CHECK_INTERVAL)
                continue
            
            for entry in pendings:
                isbn13 = entry.isbn
                log_app("INFO", f"Processing ISBN13: {isbn13}")
                
                # Step 1: Fetch book metadata
                try:
                    meta = fetch_book_data(isbn13)
                    log_app("SUCCESS", f"Fetched metadata for {isbn13}")
                except Exception as e:
                    log_app("ERROR", f"Metadata fetch failed for {isbn13}: {e}")
                    entry.stucked = True
                    session.commit()
                    continue

                isbn10 = meta.get("isbn")
                
                # Skip if no ISBN-10 (needed for covers and indexing)
                if not isbn10:
                    log_app("WARNING", f"No ISBN-10 found for {isbn13}, marking as stuck")
                    entry.stucked = True
                    session.commit()
                    continue
                
                # Step 2: Download cover image
                try:
                    cover_path = download_cover(
                        isbn10, isbn13, 
                        cover_url=meta.get("cover_url"), 
                        google_id=meta.get("google_id")
                    )
                    if cover_path:
                        log_app("SUCCESS", f"Cover saved at {cover_path}")
                except Exception as e:
                    log_app("WARNING", f"Cover download error for {isbn10}: {e}")

                # Step 3: Add to search index
                try:
                    add_to_index(isbn10)
                    log_app("SUCCESS", f"Indexed {isbn10}")
                except Exception as e:
                    log_app("ERROR", f"Indexing failed for {isbn10}: {e}")

                # Step 4: Save book to database
                try:
                    # Create book object with only valid database fields
                    book_fields = {k: meta[k] for k in meta 
                                 if k in {c.name for c in Book.__table__.columns}}
                    book = Book(**book_fields)
                    
                    session.add(book)
                    session.commit()
                    
                    # Log successful addition
                    log_scan(
                        isbn=book.isbn,
                        status="success", 
                        message=f"Book added to database: {book.title}",
                        extra={"source": "worker", "action": "book_added"}
                    )
                    
                    print(f"✅ Book added: {book.title}")
                    
                    # Remove from pending queue
                    session.delete(entry)
                    session.commit()
                    
                except Exception as e:
                    session.rollback()
                    log_app("ERROR", f"DB save failed for {isbn13}: {e}")
                    entry.stucked = True
                    session.commit()
        
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    log_app("INFO", "Worker started - monitoring pending books...")
    process_pending_books()
