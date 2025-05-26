#!/usr/bin/env python3
import os
import json
import faiss
from utils.db_models import SessionLocal, Book, AppLog
from setup.build_index import add_to_index

# Paths configuration
BASE_DIR    = os.path.dirname(__file__)
DATA_DIR    = os.path.abspath(os.path.join(BASE_DIR, "data"))
COVERS_DIR  = os.path.join(DATA_DIR, "covers")
INDEX_PATH  = os.path.join(DATA_DIR, "index.faiss")
NAMES_PATH  = os.path.join(DATA_DIR, "image_names.json")


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log an event to the database and print to console.
    """
    session = SessionLocal()
    session.add(AppLog(level=level, message=message, context=context))
    session.commit()
    session.close()
    print(f"[{level}] {message}")


def main():
    # 1) Load ISBNs from all sources
    session = SessionLocal()
    db_isbns = {isbn for (isbn,) in session.query(Book.isbn).all()}
    session.close()
    log_app("INFO", f"DB ISBN count: {len(db_isbns)}")

    cover_files = [f for f in os.listdir(COVERS_DIR) if f.lower().endswith('.jpg')]
    cover_isbns = {os.path.splitext(f)[0] for f in cover_files}
    log_app("INFO", f"Cover files count: {len(cover_isbns)}")

    try:
        with open(NAMES_PATH, 'r', encoding='utf-8') as f:
            names_list = json.load(f)
    except Exception as e:
        log_app("ERROR", f"Cannot load {NAMES_PATH}: {e}")
        return
    # Deduplicate preserving order
    seen = set()
    unique_names = []
    for n in names_list:
        if n not in seen:
            seen.add(n)
            unique_names.append(n)
    json_isbns = [os.path.splitext(n)[0] for n in unique_names]
    json_set = set(json_isbns)
    log_app("INFO", f"image_names.json ISBN count: {len(json_set)} (deduped from {len(names_list)})")

    # Read FAISS index and derive ISBNs in order
    try:
        index = faiss.read_index(INDEX_PATH)
        ntotal = index.ntotal
        # Assume index order matches unique_names order
        index_isbns = set(json_isbns[:ntotal])
        log_app("INFO", f"FAISS index vectors count: {ntotal}")
    except Exception as e:
        log_app("ERROR", f"Cannot read FAISS index: {e}")
        index_isbns = set()

    # 2) Compute intersection across four sources
    sources = [db_isbns, cover_isbns, json_set, index_isbns]
    keep_isbns = set.intersection(*[s for s in sources if s])
    log_app("INFO", f"ISBNs present in all four sources: {len(keep_isbns)}")

    # 3) Remove from each source any ISBN not in keep_isbns
    # DB cleanup
    session = SessionLocal()
    removed_db = 0
    for isbn in list(db_isbns):
        if isbn not in keep_isbns:
            book = session.query(Book).filter_by(isbn=isbn).first()
            if book:
                session.delete(book)
                removed_db += 1
    session.commit()
    session.close()
    log_app("REPAIR", f"Removed {removed_db} DB records not in all sources")

    # Covers cleanup
    removed_covers = 0
    for isbn in cover_isbns:
        if isbn not in keep_isbns:
            path = os.path.join(COVERS_DIR, f"{isbn}.jpg")
            if os.path.isfile(path):
                os.remove(path)
                removed_covers += 1
    log_app("REPAIR", f"Removed {removed_covers} cover files not in all sources")

    # JSON cleanup - write back only keep_isbns in original order
    cleaned = [f"{isbn}.jpg" for isbn in json_isbns if isbn in keep_isbns]
    try:
        with open(NAMES_PATH, 'w', encoding='utf-8') as f:
            json.dump(cleaned, f, ensure_ascii=False, indent=2)
        log_app("REPAIR", f"Updated image_names.json with {len(cleaned)} entries")
    except Exception as e:
        log_app("ERROR", f"Failed writing cleaned names JSON: {e}")

    # 4) Rebuild FAISS index from scratch
    if os.path.exists(INDEX_PATH):
        try:
            os.remove(INDEX_PATH)
            log_app("REPAIR", f"Removed old FAISS index at {INDEX_PATH}")
        except Exception as e:
            log_app("ERROR", f"Failed to remove old index: {e}")
    session = SessionLocal()
    rebuilt = 0
    for isbn in cleaned:
        isbn10 = os.path.splitext(isbn)[0]
        book = session.query(Book).filter_by(isbn=isbn10).first()
        if book and book.isbn:
            try:
                add_to_index(book.isbn)
                rebuilt += 1
            except Exception as e:
                log_app("ERROR", f"Indexing failed for {book.isbn}: {e}")
    session.close()
    log_app("REPAIR", f"Rebuilt FAISS index with {rebuilt} vectors")

if __name__ == '__main__':
    main()
