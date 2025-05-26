import json
import os
from sqlalchemy.orm import Session
from backend.utils.db_models import Book, SessionLocal
from tqdm import tqdm

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
METADATA_PATH = os.path.join(DATA_DIR, "metadata.json")
SKIPPED_PATH = os.path.join(DATA_DIR, "skipped_isbns.txt")

def import_metadata():
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    session: Session = SessionLocal()
    count = 0
    skipped = []

    print(f"📦 Importation de {len(metadata)} livres depuis metadata.json...")

    for isbn in tqdm(metadata, desc="📥 Insertion dans la base", unit="livre"):
        book = metadata[isbn]
        exists = session.query(Book).filter_by(isbn=isbn).first()
        if exists:
            skipped.append(isbn)
            continue

        new_book = Book(
            isbn=isbn,
            title=book.get("title"),
            authors=book.get("authors"),
            isbn13=book.get("isbn13"),
            pages=book.get("pages"),
            publication_date=book.get("publication_date"),
            publisher=book.get("publisher"),
            language_code=book.get("language_code"),
            cover_url=book.get("cover_url"),
            external_links=book.get("external_links"),
            description=book.get("description"),
            genres=book.get("genres"),
            average_rating=book.get("average_rating"),
            ratings_count=book.get("ratings_count")
        )

        session.add(new_book)
        count += 1

    session.commit()
    session.close()

    if skipped:
        with open(SKIPPED_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(skipped))
        print(f"⚠️  {len(skipped)} livres déjà présents. Liste enregistrée dans 'skipped_isbns.txt'.")

    print(f"\n✅ {count} livres importés depuis metadata.json vers la base de données.")

if __name__ == "__main__":
    import_metadata()
