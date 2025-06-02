"""
Book Search API

Provides text-based search functionality across the book database.
Searches multiple fields including title, authors, ISBN, and genres
with case-insensitive partial matching.
"""

from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, Book
from sqlalchemy import or_

search_api = Blueprint("search_api", __name__)


@search_api.route("/api/search", methods=["GET"])
def search_books():
    """
    Search for books across multiple fields.

    Query parameter:
        q: Search query string

    Returns:
        200: List of matching books (limited to 30 results)
        200: Empty array if no query provided

    Search fields:
        - title: Book title (partial match)
        - isbn: ISBN-10 (partial match)
        - isbn13: ISBN-13 (partial match)
        - authors: Author names (partial match)
        - genres: Genre categories (partial match)

    All searches are case-insensitive and support partial matching.
    """
    q = request.args.get("q", "").strip()

    # Return empty results if no search query provided
    if not q:
        return jsonify([])

    session = SessionLocal()

    # Perform case-insensitive partial match across multiple fields
    books = session.query(Book).filter(
        or_(
            Book.title.ilike(f"%{q}%"),
            Book.isbn.ilike(f"%{q}%"),
            Book.isbn13.ilike(f"%{q}%"),
            Book.authors.ilike(f"%{q}%"),
            Book.genres.ilike(f"%{q}%"),
        )
    ).limit(30).all()  # Limit results to prevent overwhelming the frontend

    # Format results for frontend consumption
    results = []
    for book in books:
        results.append(
            {
                "isbn": book.isbn,
                "isbn13": book.isbn13,
                "title": book.title,
                "authors": book.authors,
                "cover_url": book.cover_url,
                "genres": book.genres,
            }
        )

    session.close()
    return jsonify(results)
