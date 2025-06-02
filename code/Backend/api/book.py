"""
Book Details API

Provides detailed information for individual books by ISBN.
Supports lookup by both ISBN-10 and ISBN-13 formats.

Used by:
- Frontend book detail pages
- Book information display
- Collection management
"""

from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, Book

bp = Blueprint("book", __name__)


@bp.route("/api/book/<isbn>", methods=["GET"])
def get_book_details(isbn):
    """
    Get detailed information for a specific book.

    Args:
        isbn: Book ISBN (accepts both ISBN-10 and ISBN-13)

    Returns:
        200: Book details with all available metadata
        404: Book not found

    Response includes all non-null book fields:
        - isbn: ISBN-10 (primary key)
        - isbn13: ISBN-13
        - title: Book title
        - authors: List of author names
        - pages: Number of pages
        - publication_date: Publication date string
        - publisher: Publisher name
        - language_code: ISO language code
        - cover_url: Original cover URL from API
        - external_links: List of related URLs
        - description: Book summary/description
        - genres: List of genre/category strings
        - average_rating: Average user rating
        - ratings_count: Number of ratings

    Note:
        Only fields with non-null values are included in the response
        to reduce payload size and avoid frontend null checks.
    """
    session = SessionLocal()

    # Search by both ISBN formats to handle either input type
    book = session.query(Book).filter(
        (Book.isbn == isbn) | (Book.isbn13 == isbn)
    ).first()

    if not book:
        session.close()
        return jsonify({"error": "Book not found"}), 404

    # Prepare complete book data dictionary
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

    # Filter out null values to clean up the response
    # This reduces payload size and prevents frontend null handling issues
    book_dict = {k: v for k, v in book_dict.items() if v is not None}

    session.close()
    return jsonify(book_dict)
