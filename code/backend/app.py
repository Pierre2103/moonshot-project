# === app.py ===
from flask import Flask
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
from api.match import create_match_api  # import ton blueprint factory
from api.barcode import barcode_api
from api.admin import admin_api
from api.users import users_api 
from api.book import bp as book_api
from api.collections import collections_api
from api.workers import register_worker, workers_api
import os
import json
from utils.db_models import SessionLocal, AppLog

# === CONFIGURATION ===
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
INDEX_FILE = os.path.join(DATA_DIR, "index.faiss")
NAMES_FILE = os.path.join(DATA_DIR, "image_names.json")
METADATA_FILE = os.path.join(DATA_DIR, "metadata.json")
device = "cpu"

def log_app(level, message, context=None):
    try:
        session = SessionLocal()
        app_log = AppLog(level=level, message=message, context=context)
        session.add(app_log)
        session.commit()
        session.close()
    except Exception as e:
        print(f"[LOGGING ERROR] {e}: {level} - {message}")

# === ÉTAPE 1 : Chargement du modèle CLIP ===
print("🔍 Étape 1: Chargement du modèle CLIP...")
log_app("INFO", "Démarrage : Chargement du modèle CLIP")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("✅ Modèle CLIP chargé.")
log_app("SUCCESS", "Modèle CLIP chargé")

# === ÉTAPE 2 : Chargement des fichiers metadata ===
print("📦 Étape 2: Chargement des fichiers FAISS et metadata...")
log_app("INFO", "Chargement des fichiers FAISS et metadata")

metadata = {}
if os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "r") as f:
        metadata = json.load(f)
print(f"✅ Metadata chargés: {len(metadata)} entrées")
log_app("SUCCESS", f"Metadata chargés: {len(metadata)} entrées")

# === INIT DE L'APP FLASK ===
app = Flask(__name__)
CORS(app)

# === ENREGISTREMENT DES BLUEPRINTS ===
print("🔧 Enregistrement des blueprints...")
log_app("INFO", "Enregistrement des blueprints")
app.register_blueprint(create_match_api(model, processor, device, INDEX_FILE, NAMES_FILE, metadata))
app.register_blueprint(barcode_api)
app.register_blueprint(admin_api)
app.register_blueprint(users_api, url_prefix="/admin/api")
app.register_blueprint(book_api)
app.register_blueprint(collections_api)
app.register_blueprint(workers_api)


# Register workers
register_worker(
    "book_worker",
    start_cmd=["python", "worker.py"],
    script_path=os.path.join(os.path.dirname(__file__), "worker.py"),
)
register_worker(
    "merge_collection_worker",
    start_cmd=["python", "merge_collection_worker.py"],
    script_path=os.path.join(os.path.dirname(__file__), "merge_collection_worker.py"),
)


# === LANCEMENT DU SERVEUR ===
if __name__ == "__main__":
    print("🚀 Lancement du serveur Flask sur http://0.0.0.0:5001")
    log_app("SUCCESS", "Lancement du serveur Flask sur http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
