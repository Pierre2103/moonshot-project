import pandas as pd
import json
import os

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "data", "books.csv")
OUTPUT_JSON = os.path.join(BASE_DIR, "..", "data", "metadata.json")

def parse_authors(authors_str):
    return list({a.strip() for a in str(authors_str).split("/")})

def build_metadata():
    df = pd.read_csv(CSV_PATH, on_bad_lines='skip')

    # Nettoyage des noms de colonnes
    df.columns = [c.strip().lower() for c in df.columns]

    # Mapping des colonnes (flexible si noms changent légèrement)
    col = {
        "isbn": next((c for c in df.columns if "isbn" == c), None),
        "isbn13": next((c for c in df.columns if "isbn13" in c), None),
        "title": next((c for c in df.columns if "title" in c), None),
        "authors": next((c for c in df.columns if "author" in c), None),
        "pages": next((c for c in df.columns if "num_pages" in c), None),
        "date": next((c for c in df.columns if "publication_date" in c), None),
        "publisher": next((c for c in df.columns if "publisher" in c), None),
        "lang": next((c for c in df.columns if "language_code" in c), None),
    }

    metadata = {}
    for _, row in df.iterrows():
        isbn = str(row[col["isbn"]]).strip()
        if isbn == "nan" or not isbn:
            continue

        isbn13 = str(row[col["isbn13"]]).strip() if col["isbn13"] and not pd.isna(row[col["isbn13"]]) else ""
        authors = parse_authors(row[col["authors"]]) if col["authors"] and not pd.isna(row[col["authors"]]) else []

        metadata[isbn] = {
            "title": row[col["title"]].strip() if col["title"] and not pd.isna(row[col["title"]]) else "",
            "authors": authors,
            "isbn13": isbn13,
            "pages": int(row[col["pages"]]) if col["pages"] and not pd.isna(row[col["pages"]]) else None,
            "publication_date": row[col["date"]] if col["date"] and not pd.isna(row[col["date"]]) else "",
            "publisher": row[col["publisher"]] if col["publisher"] and not pd.isna(row[col["publisher"]]) else "",
            "language_code": row[col["lang"]] if col["lang"] and not pd.isna(row[col["lang"]]) else "",
            "cover_url": f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg",
            "external_links": {
                "goodreads": f"https://www.goodreads.com/search?q={isbn}",
                "amazon": f"https://www.amazon.com/dp/{isbn}",
                "bookshop": f"https://bookshop.org/p/books/?ean={isbn13}"
            },
            "description": "",  # enrichi plus tard
            "genres": []
        }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"✅ metadata.json généré avec {len(metadata)} livres.")

if __name__ == "__main__":
    build_metadata()
