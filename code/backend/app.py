"""
Main Flask Application

This is the entry point for the book scanning and matching service.
The application provides:
- Image-based book cover matching using CLIP embeddings
- Barcode scanning for book identification  
- User management and scan history
- Book collections and search functionality
- Administrative tools and analytics

The app loads CLIP model on startup and registers all API blueprints.
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from flask import Flask
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
from api.match import create_match_api
from api.barcode import barcode_api
from api.admin import admin_api
from api.users import users_api 
from api.book import bp as book_api
from api.collections import collections_api
from api.workers import register_worker, workers_api
from api.search import search_api
import json
from utils.db_models import SessionLocal, AppLog, calculate_daily_stats
import threading
import time
from datetime import datetime, time as dt_time

# Application configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
INDEX_FILE = os.path.join(DATA_DIR, "index.faiss")
NAMES_FILE = os.path.join(DATA_DIR, "image_names.json")
METADATA_FILE = os.path.join(DATA_DIR, "metadata.json")
device = "cpu"  # Use CPU for CLIP model (change to "cuda" if GPU available)


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log application events to database with fallback to console.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
        message: Human-readable log message
        context: Optional additional context data
    """
    try:
        session = SessionLocal()
        app_log = AppLog(level=level, message=message, context=context)
        session.add(app_log)
        session.commit()
        session.close()
    except Exception as e:
        print(f"[LOGGING ERROR] {e}: {level} - {message}")


# Step 1: Load CLIP model for image matching
print("🔍 Step 1: Loading CLIP model...")
log_app("INFO", "Startup: Loading CLIP model")
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("✅ CLIP model loaded.")
log_app("SUCCESS", "CLIP model loaded")

# Step 2: Load metadata files
print("📦 Step 2: Loading FAISS and metadata files...")
log_app("INFO", "Loading FAISS and metadata files")

metadata = {}
if os.path.exists(METADATA_FILE):
    with open(METADATA_FILE, "r") as f:
        metadata = json.load(f)
print(f"✅ Metadata loaded: {len(metadata)} entries")
log_app("SUCCESS", f"Metadata loaded: {len(metadata)} entries")

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend

# Register API blueprints
print("🔧 Registering blueprints...")
log_app("INFO", "Registering blueprints")

# Image matching API (requires CLIP model and index files)
app.register_blueprint(create_match_api(model, processor, device, INDEX_FILE, NAMES_FILE, metadata))

# Core APIs
app.register_blueprint(barcode_api)      # Barcode scanning and book queue
app.register_blueprint(admin_api)        # Administrative tools and analytics
app.register_blueprint(users_api)        # User management and scan history
app.register_blueprint(book_api)         # Individual book details
app.register_blueprint(collections_api)  # User book collections
app.register_blueprint(workers_api)      # Worker process management
app.register_blueprint(search_api)       # Book search functionality

# Register background workers
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


def daily_stats_scheduler() -> None:
    """
    Background thread that calculates daily statistics at midnight.
    
    Runs in a loop checking the time every minute. When it's between
    00:05-00:10, it triggers the daily stats calculation to ensure
    all logs from the previous day are captured.
    """
    while True:
        now = datetime.now()
        target_time = dt_time(0, 5)  # 00:05 - after midnight to capture all logs
        
        # Calculate stats during 5-minute window to avoid multiple calculations
        if target_time <= now.time() < dt_time(0, 10):
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


if __name__ == "__main__":
    # Start daily statistics scheduler in background thread
    stats_thread = threading.Thread(target=daily_stats_scheduler, daemon=True)
    stats_thread.start()
    log_app("INFO", "Daily stats scheduler started")
    
    print("🚀 Starting Flask server on http://0.0.0.0:5001")
    log_app("SUCCESS", "Starting Flask server on http://0.0.0.0:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
