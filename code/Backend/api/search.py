from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, Book
from sqlalchemy import or_

search_api = Blueprint("search_api", __name__)

@search_api.route("/api/search", methods=["GET"])
def search_books():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])

    session = SessionLocal()
    # Case-insensitive, partial match on title, authors, isbn, isbn13, genres
    books = session.query(Book).filter(
        or_(
            Book.title.ilike(f"%{q}%"),
            Book.isbn.ilike(f"%{q}%"),
            Book.isbn13.ilike(f"%{q}%"),
            Book.authors.ilike(f"%{q}%"),
            Book.genres.ilike(f"%{q}%"),
        )
    ).limit(30).all()
    results = []
    for book in books:
        results.append({
            "isbn": book.isbn,
            "isbn13": book.isbn13,
            "title": book.title,
            "authors": book.authors,
            "cover_url": book.cover_url,
            "genres": book.genres,
        })
    session.close()
    return jsonify(results)
