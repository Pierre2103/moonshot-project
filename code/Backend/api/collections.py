"""
Collections API

Manages user book collections - allows users to create, update, and organize
their personal book collections. Each collection has a name, icon, and belongs
to a specific user.

Key features:
- Auto-create users when needed
- CRUD operations for collections
- Add/remove books from collections
- Collection sharing and management
"""

from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, User, Collection, CollectionBook, UserScan, Book, AppLog
from sqlalchemy.exc import IntegrityError
import random
from datetime import datetime
from urllib.parse import unquote

collections_api = Blueprint("collections", __name__)


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log application events for collection tracking and analytics.
    
    Args:
        level: Log level (INFO, SUCCESS, ERROR, WARNING)
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


@collections_api.route("/api/collections/<username>", methods=["GET"])
def get_collections(username):
    """
    Get all collections for a specific user.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: List of collections with id, name, and icon
        200: Empty array if user doesn't exist (not 404 for better UX)
    """
    username = unquote(username)
    session = SessionLocal()
    
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify([]), 200  # Return empty array instead of 404 for better UX
    
    collections = session.query(Collection).filter_by(owner=user.id).all()
    result = [
        {"id": c.id, "name": c.name, "icon": c.icon}
        for c in collections
    ]
    session.close()
    return jsonify(result)


@collections_api.route("/api/collections/<username>", methods=["POST"])
def create_collection(username):
    """
    Create a new collection for a user.
    
    Auto-creates the user if they don't exist yet.
    
    Args:
        username: URL-encoded username
        
    Expected JSON payload:
        {"name": "My Books", "icon": "book"}
        
    Returns:
        201: Created collection with id, name, and icon
        400: Missing name or icon
    """
    username = unquote(username)
    data = request.json
    name = data.get("name")
    icon = data.get("icon")
    
    if not name or not icon:
        return jsonify({"error": "Missing name or icon"}), 400
    
    session = SessionLocal()
    
    # Get or create user
    user = session.query(User).filter_by(username=username).first()
    if not user:
        user = User(username=username)
        session.add(user)
        session.commit()
    
    # Create collection
    collection = Collection(name=name, owner=user.id, icon=icon)
    session.add(collection)
    session.commit()
    
    # Log collection creation for daily statistics
    log_app("SUCCESS", f"Collection created: '{name}' by user {username}", {
        "collection_id": collection.id,
        "collection_name": name,
        "username": username,
        "user_id": user.id,
        "action": "collection_created"
    })
    
    result = {"id": collection.id, "name": collection.name, "icon": collection.icon}
    session.close()
    return jsonify(result), 201


@collections_api.route("/api/collections/<username>/<int:collection_id>/add", methods=["POST"])
def add_book_to_collection(username, collection_id):
    """
    Add a book to a specific collection.
    
    Args:
        username: URL-encoded username
        collection_id: Collection ID
        
    Expected JSON payload:
        {"isbn": "1234567890"}
        
    Returns:
        201: Book added successfully
        200: Book already in collection
        400: Missing ISBN or book doesn't exist in database
        404: User or collection not found
    """
    username = unquote(username)
    data = request.json
    isbn = data.get("isbn")
    
    if not isbn:
        return jsonify({"error": "Missing ISBN"}), 400
    
    session = SessionLocal()
    
    # Verify user and collection ownership
    user = session.query(User).filter_by(username=username).first()
    collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first() if user else None
    
    if not user or not collection:
        session.close()
        return jsonify({"error": "User or collection not found"}), 404
    
    # Check if book is already in collection
    exists = session.query(CollectionBook).filter_by(collection_id=collection_id, isbn=isbn).first()
    if exists:
        session.close()
        return jsonify({"message": "Book already in collection"}), 200
    
    # Add book to collection
    cb = CollectionBook(collection_id=collection_id, isbn=isbn)
    session.add(cb)
    
    try:
        session.commit()
        session.close()
        return jsonify({"message": "Book added to collection"}), 201
    except IntegrityError:
        # Foreign key constraint violation - book doesn't exist in database
        session.rollback()
        session.close()
        return jsonify({"error": "Book does not exist in database"}), 400


@collections_api.route("/api/collections/<int:collection_id>/books", methods=["GET"])
def get_books_in_collection(collection_id):
    """
    Get all books in a specific collection.
    
    Args:
        collection_id: Collection ID
        
    Returns:
        200: List of books with isbn, title, cover_url, and authors
    """
    session = SessionLocal()
    
    # Join collections_books with books table to get full book details
    books = (
        session.query(Book)
        .join(CollectionBook, CollectionBook.isbn == Book.isbn)
        .filter(CollectionBook.collection_id == collection_id)
        .all()
    )
    
    result = [
        {
            "isbn": b.isbn,
            "title": b.title,
            "cover_url": b.cover_url,
            "authors": b.authors,
        }
        for b in books
    ]
    
    session.close()
    return jsonify(result)


@collections_api.route("/api/collections/<int:collection_id>/books/<isbn>", methods=["DELETE"])
def remove_book_from_collection(collection_id, isbn):
    """
    Remove a book from a collection.
    
    Args:
        collection_id: Collection ID
        isbn: Book ISBN to remove
        
    Returns:
        200: Book removed successfully
        404: Book not in collection
    """
    session = SessionLocal()
    
    cb = session.query(CollectionBook).filter_by(collection_id=collection_id, isbn=isbn).first()
    if not cb:
        session.close()
        return jsonify({"error": "Book not in collection"}), 404
    
    session.delete(cb)
    session.commit()
    session.close()
    return jsonify({"message": "Book removed from collection"}), 200


@collections_api.route("/api/collections/<username>/<int:collection_id>", methods=["PUT"])
def update_collection(username, collection_id):
    """
    Update collection name and icon.
    
    Args:
        username: URL-encoded username
        collection_id: Collection ID
        
    Expected JSON payload:
        {"name": "Updated Name", "icon": "updated_icon"}
        
    Returns:
        200: Updated collection data
        400: Missing name or icon
        404: User or collection not found
    """
    username = unquote(username)
    data = request.json
    name = data.get("name")
    icon = data.get("icon")
    
    if not name or not icon:
        return jsonify({"error": "Missing name or icon"}), 400
    
    session = SessionLocal()
    
    # Verify user and collection ownership
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    
    collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first()
    if not collection:
        session.close()
        return jsonify({"error": "Collection not found"}), 404
    
    # Update collection
    collection.name = name
    collection.icon = icon
    session.commit()
    
    result = {"id": collection.id, "name": collection.name, "icon": collection.icon}
    session.close()
    return jsonify(result)


@collections_api.route("/api/collections/<username>/<int:collection_id>", methods=["DELETE"])
def delete_collection(username, collection_id):
    """
    Delete a collection and all its books.
    
    Args:
        username: URL-encoded username
        collection_id: Collection ID
        
    Returns:
        200: Collection deleted successfully
        404: User or collection not found
    """
    username = unquote(username)
    session = SessionLocal()
    
    # Verify user and collection ownership
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    
    collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first()
    if not collection:
        session.close()
        return jsonify({"error": "Collection not found"}), 404
    
    collection_name = collection.name
    
    # Delete all books in collection first (cascade delete)
    session.query(CollectionBook).filter_by(collection_id=collection_id).delete()
    
    # Delete the collection itself
    session.delete(collection)
    session.commit()
    
    # Log collection deletion for analytics
    log_app("INFO", f"Collection deleted: '{collection_name}' by user {username}", {
        "collection_id": collection_id,
        "collection_name": collection_name,
        "username": username,
        "user_id": user.id,
        "action": "collection_deleted"
    })
    
    session.close()
    return jsonify({"message": "Collection deleted"}), 200


@collections_api.route("/api/collections/<username>/<int:collection_id>/add_invalid", methods=["POST"])
def add_book_to_collection_invalid(username, collection_id):
    """
    Test endpoint that always returns an error.
    
    Used for testing error handling in the frontend.
    
    Returns:
        404: Always returns invalid collection error
    """
    return jsonify({"error": "Invalid collection"}), 404
