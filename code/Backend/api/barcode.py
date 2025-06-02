"""
Barcode Scanning API

Handles barcode scan requests from the frontend. When a barcode is scanned:
1. Checks if the book already exists in the database
2. Checks if it's already queued for processing
3. Adds new books to the pending queue for worker processing
4. Logs all scan attempts for analytics

Also provides worker error reporting endpoint.
"""

from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from utils.db_models import SessionLocal, Book, PendingBook, ScanLog, AppLog

barcode_api = Blueprint("barcode_api", __name__)


def log_app(level: str, message: str, context: dict = None) -> None:
    """Log application events to database."""
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()


def log_scan(isbn: str, status: str, message: str, extra: dict = None) -> None:
    """Log scan events for analytics and debugging."""
    session = SessionLocal()
    scan_log = ScanLog(isbn=isbn, status=status, message=message, extra=extra)
    session.add(scan_log)
    session.commit()
    session.close()


@barcode_api.route("/barcode", methods=["POST"])
def scan_barcode():
    """
    Process a barcode scan request.

    Expected JSON payload: {"isbn": "1234567890123"}

    Returns:
        200: Book status (already exists, queued, or newly added to queue)
        400: Invalid request (missing ISBN)

    Response includes:
        - message: Human-readable status
        - isbn: Processed ISBN (may be normalized)
        - already_in_dataset: Boolean indicating if book exists
        - already_in_queue: Boolean indicating if book is pending
        - title: Book title (if already exists)
        - cover_url: Cover image URL (if already exists)
    """
    log_app("INFO", "Barcode scan request received")

    data = request.get_json()
    if not data or "isbn" not in data:
        log_app("ERROR", "No ISBN provided in request", {"data": data})
        log_scan(None, "error", "No isbn provided", {"data": data})
        return jsonify({"error": "No isbn provided"}), 400

    raw_isbn = data["isbn"].strip()
    log_app("INFO", f"Processing ISBN: {raw_isbn}")

    session: Session = SessionLocal()

    # Check if book already exists (try both ISBN13 and ISBN10)
    book = session.query(Book).filter_by(isbn13=raw_isbn).first()
    if not book:
        book = session.query(Book).filter_by(isbn=raw_isbn).first()

    if book:
        log_app("WARNING", "Book already exists in dataset", {"isbn": raw_isbn})
        isbn10 = book.isbn  # Use ISBN10 as canonical reference
        log_scan(raw_isbn, "error", "Book already in dataset")
        session.close()
        return jsonify({
            "message": "❌ Ce livre est déjà présent dans la base.",
            "isbn": isbn10,
            "already_in_dataset": True,
            "already_in_queue": False,
            "title": book.title,
            "cover_url": f"/cover/{isbn10}.jpg"
        }), 200

    # Use raw ISBN for processing (worker will handle ISBN10 extraction)
    isbn_to_insert = raw_isbn

    # If we have an existing book with this ISBN13, use its ISBN10
    existing_book = session.query(Book).filter_by(isbn13=raw_isbn).first()
    if existing_book:
        isbn_to_insert = existing_book.isbn

    # Check if already in processing queue
    already_pending = session.query(PendingBook).filter_by(isbn=isbn_to_insert).first()
    if already_pending:
        log_app("INFO", "Book already pending processing", {"isbn": isbn_to_insert})
        session.close()
        log_scan(raw_isbn, "pending", "Book already in queue")
        return jsonify({
            "message": "⏳ Ce livre est déjà en attente de validation.",
            "isbn": isbn_to_insert,
            "already_in_dataset": False,
            "already_in_queue": True
        }), 200

    # Add to processing queue
    try:
        pending = PendingBook(isbn=isbn_to_insert)
        session.add(pending)
        session.commit()
        log_app("SUCCESS", "Book added to processing queue", {"isbn": isbn_to_insert})
        log_scan(isbn_to_insert, "success", "Book added to pending")
        response_message = {
            "message": "📬 Livre ajouté à la file d'attente.",
            "isbn": isbn_to_insert,
            "already_in_dataset": False,
            "already_in_queue": False
        }
    except Exception as e:
        session.rollback()
        log_app("ERROR", f"Failed to add book to pending queue: {e}", {"isbn": isbn_to_insert})
        # Return "already queued" message as fallback for constraint errors
        response_message = {
            "message": "⏳ Ce livre est déjà en attente de validation.",
            "isbn": isbn_to_insert,
            "already_in_dataset": False,
            "already_in_queue": True
        }

    session.close()
    return jsonify(response_message), 200


@barcode_api.route("/worker-errors", methods=["GET"])
def get_worker_errors():
    """
    Get and clear books that failed worker processing.

    Returns list of books marked as "stuck" by the worker process.
    Removes them from the queue after reporting to prevent re-processing.

    Returns:
        200: List of error objects with ISBN and message

    Response format:
        {"errors": [{"isbn": "1234567890", "message": "Failed to process..."}]}
    """
    session: Session = SessionLocal()

    # Get books that failed processing (marked as stuck)
    stuck_books = session.query(PendingBook).filter_by(stucked=True).all()

    errors = []
    for book in stuck_books:
        errors.append({
            "isbn": book.isbn,
            "message": f"Failed to process book {book.isbn}"
        })
        # Remove from queue after reporting
        session.delete(book)

    if errors:
        session.commit()
        log_app("INFO", f"Reported {len(errors)} worker errors to frontend")

    session.close()
    return jsonify({"errors": errors}), 200