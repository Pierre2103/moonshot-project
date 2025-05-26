from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, Book

bp = Blueprint("book", __name__)

@bp.route("/api/book/<isbn>", methods=["GET"])
def get_book_details(isbn):
    session = SessionLocal()
    book = session.query(Book).filter((Book.isbn == isbn) | (Book.isbn13 == isbn)).first()
    if not book:
        session.close()
        return jsonify({"error": "Book not found"}), 404
    # Prepare response dict, only include non-null fields
    book_dict = {
        "isbn": book.isbn,
        "isbn13": book.isbn13,
        "title": book.title,
        "authors": book.authors,
        "pages": book.pages,
        "publication_date": book.publication_date,
        "publisher": book.publisher,
        "language_code": book.language_code,
        "cover_url": book.cover_url,
        "external_links": book.external_links,
        "description": book.description,
        "genres": book.genres,
        "average_rating": book.average_rating,
        "ratings_count": book.ratings_count,
    }
    # Remove keys with None values
    book_dict = {k: v for k, v in book_dict.items() if v is not None}
    session.close()
    return jsonify(book_dict)
