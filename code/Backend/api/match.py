"""
Image Matching API

Handles book cover image matching using CLIP embeddings and FAISS search.
When users upload an image:
1. Processes the image with CLIP model to generate embeddings
2. Searches the FAISS index for similar book covers
3. Returns ranked suggestions with book metadata
4. Logs all matching attempts for analytics

Key features:
- Real-time image processing with CLIP
- FAISS-based similarity search
- Multiple match alternatives
- Robust error handling with database retries
- Static cover image serving
"""

from flask import Blueprint, request, jsonify, send_from_directory
from PIL import UnidentifiedImageError
from io import BytesIO
import numpy as np
import torch
import os
import faiss
import json
import time
import random
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, TimeoutError
from utils.db_models import SessionLocal, Book, ScanLog, AppLog

# Directory paths for covers and index files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COVERS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "covers"))
INDEX_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "index.faiss"))
NAMES_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "image_names.json"))
print(f"match.py: COVERS_DIR={COVERS_DIR}")


def retry_db_operation(operation, max_retries: int = 3, base_delay: float = 0.1):
    """
    Retry database operations with exponential backoff.
    
    Handles transient database issues during high-load scenarios
    when multiple users are uploading images simultaneously.
    
    Args:
        operation: Function to execute (should handle session management)
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds (doubles each retry)
        
    Returns:
        Result from operation function
        
    Raises:
        OperationalError/TimeoutError: If all retries are exhausted
    """
    for attempt in range(max_retries):
        try:
            return operation()
        except (OperationalError, TimeoutError) as e:
            if attempt == max_retries - 1:
                raise e
            # Exponential backoff with jitter to avoid thundering herd
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
            time.sleep(delay)
    return None


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log application events with database retry mechanism.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
        message: Human-readable log message
        context: Optional additional context data
    """
    def db_operation():
        session = SessionLocal()
        try:
            app_log = AppLog(level=level, message=message, context=context)
            session.add(app_log)
            session.commit()
        finally:
            session.close()
    
    try:
        retry_db_operation(db_operation, max_retries=2)
    except Exception:
        # If logging fails, don't crash the main operation
        pass


def log_scan(isbn: str, status: str, message: str, extra: dict = None) -> None:
    """
    Log scan events for analytics and debugging.
    
    Args:
        isbn: Book ISBN that was matched (or None for failures)
        status: Scan result (success, error, not_found)
        message: Human-readable status message
        extra: Additional context (scan type, user, match details)
    """
    def db_operation():
        session = SessionLocal()
        try:
            scan_log = ScanLog(isbn=isbn, status=status, message=message, extra=extra)
            session.add(scan_log)
            session.commit()
        finally:
            session.close()
    
    try:
        retry_db_operation(db_operation, max_retries=2)
    except Exception:
        # If logging fails, don't crash the main operation
        pass


def create_match_api(model, processor, device, index_path=INDEX_PATH, names_path=NAMES_PATH, metadata=None):
    """
    Factory function to create the match API blueprint with injected dependencies.
    
    Args:
        model: Pre-loaded CLIP model for image processing
        processor: CLIP processor for input preparation
        device: Device to run model on ("cpu" or "cuda")
        index_path: Path to FAISS index file
        names_path: Path to image names mapping file
        metadata: Optional metadata dictionary (unused currently)
        
    Returns:
        Flask Blueprint configured with match endpoints
    """
    match_api = Blueprint("match_api", __name__)

    @match_api.route("/match", methods=["POST"])
    def match_cover():
        """
        Match uploaded book cover image against database.
        
        Accepts multipart/form-data with:
        - image: Image file (JPG, PNG, etc.)
        - username: Optional username for analytics
        
        Returns:
            200: Match found with book details and alternatives
            400: Invalid image or no image provided
            404: No valid matches found
            503: Database timeout
            500: Server error
            
        Response includes:
        - filename: Matched cover filename
        - score: Similarity score (lower is better)
        - title: Book title
        - authors: List of authors
        - cover_url: URL to serve the cover image
        - alternatives: List of alternative matches
        """
        log_app("INFO", "Image matching request received")

        # Extract username from form data for analytics
        username = request.form.get("username")

        # Validate image upload
        if "image" not in request.files:
            log_app("ERROR", "No image file found in request")
            log_scan(
                isbn=None,
                status="error",
                message="No image file found in request",
                extra={"request_info": "image match", "username": username}
            )
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        log_app("INFO", f"Image received: {image_file.filename} ({image_file.content_type})")

        try:
            # Process uploaded image
            image_bytes = image_file.read()
            log_app("INFO", f"Image size: {len(image_bytes)} bytes")

            # Convert to PIL Image and prepare for CLIP
            from PIL import Image
            image = Image.open(BytesIO(image_bytes)).convert("RGB").resize((224, 224))
            inputs = processor(text=[""], images=image, return_tensors="pt").to(device)

            # Generate image embedding using CLIP
            with torch.no_grad():
                outputs = model(**inputs)
                embedding = outputs.image_embeds[0].cpu().numpy()

            # Reload index and names for each search (ensures fresh data)
            log_app("INFO", "Reloading FAISS index and image names")
            index = faiss.read_index(str(index_path))
            with open(str(names_path), "r") as f:
                image_names = json.load(f)

            # Search for similar images (k=6 to get top match + 5 alternatives)
            D, I = index.search(np.array([embedding]), k=6)
            indices = I[0]
            distances = D[0]

            def get_book_suggestions():
                """
                Retrieve book details for matched cover indices.
                
                Returns:
                    List of book suggestions with metadata
                """
                session: Session = SessionLocal()
                try:
                    suggestions = []
                    for idx, score in zip(indices, distances):
                        filename = image_names[idx]
                        # Extract ISBN from filename (remove .jpg extension)
                        isbn = os.path.splitext(filename)[0]
                        
                        # Get book details from database
                        book = session.query(Book).filter_by(isbn=isbn).first()
                        if book:
                            suggestions.append({
                                "filename": filename,
                                "score": float(score),
                                "title": book.title,
                                "authors": book.authors,
                                "cover_url": f"/cover/{filename}"
                            })
                    return suggestions
                finally:
                    session.close()

            # Get book suggestions with retry mechanism
            try:
                suggestions = retry_db_operation(get_book_suggestions, max_retries=3)
            except (OperationalError, TimeoutError) as e:
                log_app("ERROR", f"Database timeout getting book suggestions: {str(e)}")
                return jsonify({"error": "Database timeout, please try again"}), 503

            # Check if any valid matches were found
            if not suggestions:
                log_app("WARNING", "No books found for this cover scan")
                log_scan(
                    isbn=None,
                    status="not_found",
                    message="No books found",
                    extra={"request_info": "image match", "username": username}
                )
                return jsonify({"error": "No valid book matches found"}), 404

            # Separate best match from alternatives
            top_match = suggestions[0]      # Best match (lowest distance)
            alternatives = suggestions[1:]  # Up to 5 alternatives

            log_app("SUCCESS", f"Match found: {top_match['title']} (score={top_match['score']})")

            # Log successful scan for analytics
            log_scan(
                isbn=top_match["filename"].split('.')[0],
                status="success",
                message="Cover image scan successful",
                extra={
                    "request_info": "image match", 
                    "details": {"top_match": top_match, "alternatives": alternatives}, 
                    "username": username
                }
            )

            # Build response with match details
            response_data = {
                "filename": top_match["filename"],
                "score": top_match["score"],
                "title": top_match["title"],
                "authors": top_match["authors"],
                "cover_url": top_match["cover_url"],
                "alternatives": alternatives
            }
            
            # Include username in response if provided
            if username:
                response_data["username"] = username

            return jsonify(response_data)

        except UnidentifiedImageError:
            log_app("ERROR", "Unreadable image format")
            log_scan(
                isbn=None,
                status="error",
                message="Unreadable image format",
                extra={"request_info": "image match", "username": username}
            )
            return jsonify({"error": "Unreadable image format"}), 400

        except Exception as e:
            log_app("ERROR", f"Server error during image matching: {str(e)}")
            log_scan(
                isbn=None,
                status="error",
                message=f"Server error: {str(e)}",
                extra={"request_info": "image match", "username": username}
            )
            return jsonify({"error": f"Internal error: {str(e)}"}), 500

    @match_api.route("/cover/<filename>", methods=["GET"])
    def serve_cover(filename):
        """
        Serve book cover images as static files.
        
        Args:
            filename: Cover image filename (e.g., "1234567890.jpg")
            
        Returns:
            Static image file from covers directory
            
        Note:
            No logging needed here as it's just static file serving.
            Covers are stored with ISBN-10 as filename.
        """
        return send_from_directory(COVERS_DIR, filename)

    return match_api
