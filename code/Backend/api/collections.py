"""
Collections API

Manages user book collections with robust error handling for database lock timeouts.
Auto-creates users when needed and provides CRUD operations for collections.
"""

from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, User, Collection, CollectionBook, UserScan, Book, AppLog
from sqlalchemy.exc import IntegrityError, OperationalError, TimeoutError
import random
import time
from datetime import datetime
from urllib.parse import unquote

collections_api = Blueprint("collections", __name__)


def retry_db_operation(operation, max_retries: int = 3, base_delay: float = 0.1):
    """
    Retry database operations with exponential backoff for lock timeout handling.
    
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
            # Exponential backoff with jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
            time.sleep(delay)
    return None


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
    
    # Find user by username
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify([]), 200  # Return empty array instead of 404 for better UX
    
    # Get all collections owned by this user
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
    Create a new collection for a user with retry mechanism.
    Auto-creates the user if they don't exist yet.
    
    Args:
        username: URL-encoded username
        
    Expected JSON payload:
        {"name": "My Books", "icon": "📚"}
        
    Returns:
        201: Created collection with id, name, and icon
        400: Missing name or icon
        503: Database timeout after retries
        500: Unexpected error
    """
    username = unquote(username)
    data = request.json
    name = data.get("name")
    icon = data.get("icon")
    
    if not name or not icon:
        return jsonify({"error": "Missing name or icon"}), 400
    
    def db_operation():
        """Database operation with proper session management."""
        session = SessionLocal()
        try:
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
            return {"result": result, "status": 201}
            
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()
    
    try:
        response = retry_db_operation(db_operation, max_retries=3)
        return jsonify(response["result"]), response["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@collections_api.route("/api/collections/<username>/<int:collection_id>/add", methods=["POST"])
def add_book_to_collection(username, collection_id):
    """
    Add a book to a specific collection with retry mechanism for lock timeouts.
    
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
        503: Database timeout after retries
        500: Unexpected error
    """
    username = unquote(username)
    data = request.json
    isbn = data.get("isbn")
    
    if not isbn:
        return jsonify({"error": "Missing ISBN"}), 400
    
    def db_operation():
        """Database operation with proper error handling and session management."""
        session = SessionLocal()
        try:
            # Verify user and collection ownership
            user = session.query(User).filter_by(username=username).first()
            collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first() if user else None
            
            if not user or not collection:
                return {"error": "User or collection not found", "status": 404}
            
            # Check if book is already in collection
            exists = session.query(CollectionBook).filter_by(collection_id=collection_id, isbn=isbn).first()
            if exists:
                return {"message": "Book already in collection", "status": 200}
            
            # Add book to collection
            cb = CollectionBook(collection_id=collection_id, isbn=isbn)
            session.add(cb)
            session.commit()
            
            return {"message": "Book added to collection", "status": 201}
            
        except IntegrityError:
            # Foreign key constraint violation - book doesn't exist in database
            session.rollback()
            return {"error": "Book does not exist in database", "status": 400}
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()
    
    try:
        response = retry_db_operation(db_operation, max_retries=3)
        return jsonify({"message": response["message"]} if "message" in response else {"error": response["error"]}), response["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


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
    Remove a book from a collection with retry mechanism.
    
    Args:
        collection_id: Collection ID
        isbn: Book ISBN to remove
        
    Returns:
        200: Book removed successfully
        404: Book not in collection
        503: Database timeout after retries
        500: Unexpected error
    """
    def db_operation():
        """Database operation with proper session management."""
        session = SessionLocal()
        try:
            cb = session.query(CollectionBook).filter_by(collection_id=collection_id, isbn=isbn).first()
            if not cb:
                return {"error": "Book not in collection", "status": 404}
            
            session.delete(cb)
            session.commit()
            return {"message": "Book removed from collection", "status": 200}
            
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()
    
    try:
        response = retry_db_operation(db_operation, max_retries=3)
        return jsonify({"message": response["message"]} if "message" in response else {"error": response["error"]}), response["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@collections_api.route("/api/collections/<username>/<int:collection_id>", methods=["PUT"])
def update_collection(username, collection_id):
    """
    Update collection name and icon with retry mechanism.
    
    Args:
        username: URL-encoded username
        collection_id: Collection ID
        
    Expected JSON payload:
        {"name": "Updated Name", "icon": "📖"}
        
    Returns:
        200: Updated collection data
        400: Missing name or icon
        404: User or collection not found
        503: Database timeout after retries
        500: Unexpected error
    """
    username = unquote(username)
    data = request.json
    name = data.get("name")
    icon = data.get("icon")
    
    if not name or not icon:
        return jsonify({"error": "Missing name or icon"}), 400
    
    def db_operation():
        """Database operation with proper session management."""
        session = SessionLocal()
        try:
            # Verify user and collection ownership
            user = session.query(User).filter_by(username=username).first()
            if not user:
                return {"error": "User not found", "status": 404}
            
            collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first()
            if not collection:
                return {"error": "Collection not found", "status": 404}
            
            # Update collection
            collection.name = name
            collection.icon = icon
            session.commit()
            
            result = {"id": collection.id, "name": collection.name, "icon": collection.icon}
            return {"result": result, "status": 200}
            
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()
    
    try:
        response = retry_db_operation(db_operation, max_retries=3)
        return jsonify(response["result"] if "result" in response else {"error": response["error"]}), response["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@collections_api.route("/api/collections/<username>/<int:collection_id>", methods=["DELETE"])
def delete_collection(username, collection_id):
    """
    Delete a collection and all its books with retry mechanism.
    
    Args:
        username: URL-encoded username
        collection_id: Collection ID
        
    Returns:
        200: Collection deleted successfully
        404: User or collection not found
        503: Database timeout after retries
        500: Unexpected error
    """
    username = unquote(username)
    
    def db_operation():
        """Database operation with proper session management."""
        session = SessionLocal()
        try:
            # Verify user and collection ownership
            user = session.query(User).filter_by(username=username).first()
            if not user:
                return {"error": "User not found", "status": 404}
            
            collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first()
            if not collection:
                return {"error": "Collection not found", "status": 404}
            
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
            
            return {"message": "Collection deleted", "status": 200}
            
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()
    
    try:
        response = retry_db_operation(db_operation, max_retries=3)
        return jsonify({"message": response["message"]}), response["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@collections_api.route("/api/collections/<username>/<int:collection_id>/add_invalid", methods=["POST"])
def add_book_to_collection_invalid(username, collection_id):
    """
    Test endpoint that always returns an error.
    Used for testing error handling in the frontend.
    
    Returns:
        404: Always returns invalid collection error
    """
    return jsonify({"error": "Invalid collection"}), 404
