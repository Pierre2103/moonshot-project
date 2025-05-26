import pandas as pd
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# === CONFIG ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "..", "data", "books.csv")
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "covers"))

NUM_WORKERS = 10  # nombre de téléchargements en parallèle

# === PRÉPARATION ===
os.makedirs(OUTPUT_DIR, exist_ok=True)

# === TÉLÉCHARGEMENT PARALLÈLE ===
def download_image(isbn):
    url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(os.path.join(OUTPUT_DIR, f"{isbn}.jpg"), "wb") as f:
                f.write(response.content)
            return f"✅ {isbn}"
        else:
            return f"❌ {isbn} - Not found"
    except Exception as e:
        return f"⚠️ {isbn} - Error: {e}"

def download_all_covers():
    # Lire le CSV
    df = pd.read_csv(CSV_FILE, on_bad_lines='skip')

    # Trouver la colonne ISBN
    isbn_col = None
    for col in df.columns:
        if "isbn" in col.lower():
            isbn_col = col
            break

    if not isbn_col:
        raise ValueError("Colonne ISBN introuvable dans le CSV")

    isbn_list = df[isbn_col].dropna().astype(str).str.strip().unique()

    print(f"📥 Téléchargement de {len(isbn_list)} images avec {NUM_WORKERS} threads...")

    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = {executor.submit(download_image, isbn): isbn for isbn in isbn_list}
        for i, future in enumerate(tqdm(as_completed(futures), total=len(futures))):
            result = future.result()
            tqdm.write(f"[{i + 1}] {result}")

    print("✅ Téléchargement terminé.")

# Empêche le lancement automatique lors de l'import
if __name__ == "__main__":
    download_all_covers()
