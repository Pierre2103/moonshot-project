#!/usr/bin/env python3
import os
import json
import faiss
from utils.db_models import SessionLocal, Book

# Paths (adjust if needed)
BASE_DIR    = os.path.dirname(__file__)
DATA_DIR    = os.path.abspath(os.path.join(BASE_DIR, "data"))
COVERS_DIR  = os.path.join(DATA_DIR, "covers")
INDEX_PATH  = os.path.join(DATA_DIR, "index.faiss")
NAMES_PATH  = os.path.join(DATA_DIR, "image_names.json")

def sync_check() -> None:
    """Verify sync between FAISS, JSON, filesystem, and DB."""
    # --- load names.json ---
    try:
        with open(NAMES_PATH, 'r', encoding='utf-8') as f:
            names = json.load(f)
    except Exception as e:
        print(f"[ERROR] Cannot load image_names.json: {e}")
        return
    total_names  = len(names)
    unique_names = len(set(names))
    duplicates   = total_names - unique_names

    # --- load FAISS index ---
    try:
        idx = faiss.read_index(INDEX_PATH)
        total_vectors = idx.ntotal
    except Exception as e:
        print(f"[ERROR] Cannot read FAISS index: {e}")
        total_vectors = None

    # --- list cover files ---
    try:
        files = [f for f in os.listdir(COVERS_DIR) if f.lower().endswith('.jpg')]
        total_covers = len(files)
        cover_set    = set(files)
    except Exception as e:
        print(f"[ERROR] Cannot list cover directory: {e}")
        total_covers = None
        cover_set    = set()

    # --- query DB ---
    try:
        session = SessionLocal()
        db_records = session.query(Book.isbn).all()
        session.close()
        db_isbns    = [isbn for (isbn,) in db_records]
        total_db    = len(db_isbns)
    except Exception as e:
        print(f"[ERROR] Cannot query database: {e}")
        total_db = None
        db_isbns = []

    # --- summary ---
    print("-- Sync Summary --")
    print(f"image_names.json: total={total_names}, unique={unique_names}, duplicates={duplicates}")
    if total_vectors is not None:
        print(f"FAISS vectors: total={total_vectors}")
    if total_covers is not None:
        print(f"Cover files: total={total_covers}")
    if total_db is not None:
        print(f"DB records: total={total_db}")

    # --- mismatches ---
    if total_vectors is not None and total_vectors != unique_names:
        print("[MISMATCH] FAISS index count != unique names count")
    if total_covers is not None and unique_names != total_covers:
        print("[MISMATCH] names count != cover files count")
    if total_db is not None and unique_names != total_db:
        print("[MISMATCH] names count != DB record count")

    # --- detail missing ---
    missing_in_names  = [f"{isbn}.jpg" for isbn in db_isbns if f"{isbn}.jpg" not in names]
    missing_in_covers = [name for name in names if name not in cover_set]

    if missing_in_names:
        print(f"DB entries missing in names.json: {missing_in_names}")
    if missing_in_covers:
        print(f"Names entries missing cover file: {missing_in_covers}")

    print("-- End of Sync Check --")

if __name__ == "__main__":
    sync_check()
