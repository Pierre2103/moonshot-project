from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from utils.db_models import SessionLocal, Book, PendingBook, ScanLog, AppLog

barcode_api = Blueprint("barcode_api", __name__)

def log_app(level, message, context=None):
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()

def log_scan(isbn, status, message, extra=None):
    session = SessionLocal()
    scan_log = ScanLog(isbn=isbn, status=status, message=message, extra=extra)
    session.add(scan_log)
    session.commit()
    session.close()

@barcode_api.route("/barcode", methods=["POST"])
def scan_barcode():
    log_app("INFO", "Requête reçue sur /barcode")

    data = request.get_json()
    if not data or "isbn" not in data:
        log_app("ERROR", "Aucun ISBN fourni dans la requête", {"data": data})
        log_scan(None, "error", "No isbn provided", {"data": data})
        return jsonify({"error": "No isbn provided"}), 400

    raw_isbn = data["isbn"].strip()
    log_app("INFO", f"ISBN reçu : {raw_isbn}")

    session: Session = SessionLocal()

    # Cherche d'abord par isbn13
    book = session.query(Book).filter_by(isbn13=raw_isbn).first()

    # Sinon essaie par isbn
    if not book:
        book = session.query(Book).filter_by(isbn=raw_isbn).first()

    if book:
        log_app("WARNING", "Livre déjà présent dans le dataset", {"isbn": raw_isbn})
        isbn10 = book.isbn  # Toujours utiliser l’isbn10 comme référence
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

    # Sinon, on insère en pending avec isbn = isbn10 si on peut deviner
    isbn_to_insert = raw_isbn  # default

    # On tente de récupérer un isbn10 depuis un livre existant avec cet isbn13
    existing_book = session.query(Book).filter_by(isbn13=raw_isbn).first()
    if existing_book:
        isbn_to_insert = existing_book.isbn

    # Vérifie s'il est déjà en attente
    already_pending = session.query(PendingBook).filter_by(isbn=isbn_to_insert).first()
    if already_pending:
        log_app("INFO", "Livre déjà en attente de validation", {"isbn": isbn_to_insert})
        session.close()
        log_scan(raw_isbn, "pending", "Book already in queue")
        return jsonify({
            "message": "⏳ Ce livre est déjà en attente de validation.",
            "isbn": isbn_to_insert,
            "already_in_dataset": False,
            "already_in_queue": True
        }), 200

    # Ajout en file d'attente - remove the duplicate check since we already checked above
    try:
        pending = PendingBook(isbn=isbn_to_insert)
        session.add(pending)
        session.commit()
        log_app("SUCCESS", "Livre ajouté à la file d'attente", {"isbn": isbn_to_insert})
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
    """Check for books that failed processing in the worker"""
    session: Session = SessionLocal()
    
    # Get books that are stuck (failed processing)
    stuck_books = session.query(PendingBook).filter_by(stucked=True).all()
    
    errors = []
    for book in stuck_books:
        errors.append({
            "isbn": book.isbn,
            "message": f"Failed to process book {book.isbn}"
        })
        # Remove the stuck book from queue after reporting
        session.delete(book)
    
    if errors:
        session.commit()
        log_app("INFO", f"Reported {len(errors)} worker errors to frontend")
    
    session.close()
    return jsonify({"errors": errors}), 200