import json
import os
import requests
from time import sleep
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
METADATA_PATH = os.path.join(DATA_DIR, "metadata.json")

OPENLIBRARY_API = "https://openlibrary.org/isbn/{}.json"
OPENLIBRARY_WORKS = "https://openlibrary.org{}"
GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes?q=isbn:{}"

MAX_WORKERS = 10
SAVE_EVERY = 100


def enrich_single_book(isbn13, entry):
    """
    Enrichit un livre à partir de son ISBN13 (scanné).
    Remplit title, isbn (isbn10), isbn13, authors, publisher, publish_date, language_code, etc.
    """
    # On commence par l'ISBN13 scanné
    entry["isbn13"] = isbn13
    entry["isbn"] = None
    entry["title"] = None

    # 1. OpenLibrary
    ol_url = f"https://openlibrary.org/isbn/{isbn13}.json"
    try:
        resp = requests.get(ol_url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            entry["title"] = data.get("title")
            # ISBN10
            if "isbn_10" in data and isinstance(data["isbn_10"], list) and data["isbn_10"]:
                entry["isbn"] = data["isbn_10"][0]
            # Publisher
            if "publishers" in data and isinstance(data["publishers"], list) and data["publishers"]:
                entry["publisher"] = data["publishers"][0]
            # Publish date
            entry["publication_date"] = data.get("publish_date")
            # Language
            if "languages" in data and isinstance(data["languages"], list) and data["languages"]:
                lang_key = data["languages"][0].get("key", "")
                entry["language_code"] = lang_key.split("/")[-1] if "/" in lang_key else lang_key
            # Authors
            if "authors" in data and isinstance(data["authors"], list):
                entry["authors"] = []
                for author in data["authors"]:
                    # Optionnel : aller chercher le nom complet via /authors/OLxxxA.json
                    entry["authors"].append(author.get("key", ""))
            # Ajoute d'autres champs si besoin
    except Exception as e:
        print(f"⚠️ Erreur enrichissement OpenLibrary pour {isbn13}: {e}")

    # 2. Google Books (optionnel, pour compléter si besoin)
    # ...

    return isbn13, entry, True


def enrich_metadata():
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    isbns = [k for k, v in metadata.items() if not v.get("description") or not v.get("average_rating")]
    updated = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(enrich_single_book, isbn, metadata[isbn]): isbn for isbn in isbns}

        for i, future in enumerate(tqdm(as_completed(futures), total=len(futures), desc="🚀 Enrichissement")):
            isbn, enriched_entry, did_update = future.result()
            metadata[isbn] = enriched_entry

            if did_update:
                updated += 1

            if i % SAVE_EVERY == 0:
                with open(METADATA_PATH, "w", encoding="utf-8") as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {updated} livres enrichis avec succès.")


if __name__ == "__main__":
    enrich_metadata()
