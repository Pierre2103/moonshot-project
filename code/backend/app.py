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
from api.search import search_api
import os
import json
from utils.db_models import SessionLocal, AppLog, calculate_daily_stats
import threading
import time
from datetime import datetime, time as dt_time

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
print("🔍 Step 1: Loading CLIP model...")
log_app("INFO", "Startup: Loading CLIP model")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("✅ CLIP model loaded.")
log_app("SUCCESS", "CLIP model loaded")

# === ÉTAPE 2 : Chargement des fichiers metadata ===
print("📦 Step 2: Loading FAISS and metadata files...")
log_app("INFO", "Loading FAISS and metadata files")

metadata = {}
if os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "r") as f:
        metadata = json.load(f)
print(f"✅ Metadata loaded: {len(metadata)} entries")
log_app("SUCCESS", f"Metadata loaded: {len(metadata)} entries")

# === INIT DE L'APP FLASK ===
app = Flask(__name__)
CORS(app)

# === ENREGISTREMENT DES BLUEPRINTS ===
print("🔧 Registering blueprints...")
log_app("INFO", "Registering blueprints")
app.register_blueprint(create_match_api(model, processor, device, INDEX_FILE, NAMES_FILE, metadata))
app.register_blueprint(barcode_api)
app.register_blueprint(admin_api)
app.register_blueprint(users_api)  # Make sure this line exists
app.register_blueprint(book_api)
app.register_blueprint(collections_api)
app.register_blueprint(workers_api)
app.register_blueprint(search_api)


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


def daily_stats_scheduler():
    """Background thread to calculate daily stats at midnight"""
    while True:
        now = datetime.now()
        # Calculate at 00:05 each day to ensure all logs are captured
        target_time = dt_time(0, 5)  # 00:05
        
        if now.time() >= target_time and now.time() < dt_time(0, 10):  # 5-minute window
            try:
                log_app("INFO", "Calculating daily stats automatically")
                calculate_daily_stats()
                log_app("SUCCESS", "Daily stats calculated successfully")
                # Sleep for 6 minutes to avoid recalculating
                time.sleep(360)
            except Exception as e:
                log_app("ERROR", f"Failed to calculate daily stats: {e}")
        
        # Check every minute
        time.sleep(60)


# === LANCEMENT DU SERVEUR ===
if __name__ == "__main__":
    # Start daily stats scheduler in background
    stats_thread = threading.Thread(target=daily_stats_scheduler, daemon=True)
    stats_thread.start()
    log_app("INFO", "Daily stats scheduler started")
    
    print("🚀 Starting Flask server on http://0.0.0.0:5001")
    log_app("SUCCESS", "Starting Flask server on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
