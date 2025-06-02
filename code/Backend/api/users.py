"""
User Management and Scan History API

Manages user accounts and tracks their book scanning activity.
Includes robust error handling with database retry mechanisms for
high-concurrency scenarios.

Key features:
- User creation and management
- Scan history tracking with timestamps
- Recently scanned books retrieval
- Database timeout handling with exponential backoff
- Debug endpoints for troubleshooting
"""

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError, OperationalError, TimeoutError
from sqlalchemy import desc
from utils.db_models import SessionLocal, User, UserScan, Book, Collection, CollectionBook
from datetime import datetime
import time
import random
from urllib.parse import unquote

users_api = Blueprint("users_api", __name__)


def retry_db_operation(operation, max_retries: int = 3, base_delay: float = 0.1):
    """
    Retry database operations with exponential backoff.
    
    Handles transient database issues like connection timeouts and lock waits
    that can occur under high load or concurrent access.
    
    Args:
        operation: Function to execute (should return result dict)
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
                # Final attempt failed, re-raise the exception
                raise e
            
            # Calculate delay with exponential backoff + jitter to avoid thundering herd
            delay = base_delay * (2 ** attempt) + random.uniform(0, 0.1)
            time.sleep(delay)
    
    return None


@users_api.route("/api/users", methods=["POST"])
def create_user():
    """
    Create a new user account.
    
    Expected JSON payload:
        {"username": "john_doe"}
        
    Returns:
        201: User created successfully with id and username
        400: Missing or empty username
        409: Username already exists
    """
    data = request.get_json()
    username = data.get("username")
    
    if not username or not username.strip():
        return jsonify({"error": "Username is required"}), 400

    session = SessionLocal()
    user = User(username=username.strip())
    session.add(user)
    
    try:
        session.commit()
        return jsonify({"id": user.id, "username": user.username}), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Username already exists"}), 409
    finally:
        session.close()


@users_api.route("/api/users", methods=["GET"])
def list_users():
    """
    Get all users in the system.
    
    Returns:
        200: List of users with id and username
    """
    session = SessionLocal()
    users = session.query(User).all()
    result = [{"id": u.id, "username": u.username} for u in users]
    session.close()
    return jsonify(result)


@users_api.route("/api/user_scans", methods=["POST"])
def add_user_scan():
    """
    Record a book scan by a user.
    
    Auto-creates the user if they don't exist. Uses retry mechanism
    to handle database contention during high-traffic periods.
    
    Expected JSON payload:
        {"username": "john_doe", "isbn": "1234567890"}
        
    Returns:
        201: Scan recorded successfully
        409: Scan already exists for this user/book combination
        503: Database timeout after retries
        500: Unexpected error
    """
    data = request.get_json()
    username = data.get("username")
    isbn = data.get("isbn")
    
    if not username or not isbn:
        return jsonify({"error": "username and isbn are required"}), 400

    def db_operation():
        """Database operation with proper error handling and session management."""
        session = SessionLocal()
        try:
            # Get or create user
            user = session.query(User).filter_by(username=username).first()
            if not user:
                user = User(username=username)
                session.add(user)
                session.commit()

            # Create scan record
            scan = UserScan(user_id=user.id, isbn=isbn, timestamp=datetime.utcnow())
            session.add(scan)
            session.commit()
            return {"success": True, "status": 201}
            
        except IntegrityError:
            session.rollback()
            return {"error": "Scan already exists", "status": 409}
        except (OperationalError, TimeoutError) as e:
            session.rollback()
            # Check if it's a timeout/lock wait issue that should be retried
            if "Lock wait timeout" in str(e) or "timeout" in str(e).lower():
                raise e  # Let retry mechanism handle it
            return {"error": f"Database error: {str(e)}", "status": 500}
        finally:
            session.close()

    try:
        result = retry_db_operation(db_operation, max_retries=3)
        if result["status"] == 201:
            return jsonify({"success": True}), 201
        else:
            return jsonify({"error": result["error"]}), result["status"]
    except (OperationalError, TimeoutError) as e:
        return jsonify({"error": f"Database timeout after retries: {str(e)}"}), 503
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


@users_api.route("/api/user_scans/<username>", methods=["DELETE"])
def delete_user_scans(username):
    """
    Delete all scan history for a user.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: All scans deleted successfully
        404: User not found
    """
    username = unquote(username)
    session = SessionLocal()
    
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    # Delete all scans for this user
    session.query(UserScan).filter_by(user_id=user.id).delete()
    session.commit()
    session.close()
    return jsonify({"message": "All scan history deleted"}), 200


@users_api.route("/api/recently_scanned/<username>", methods=["GET"])
def get_recently_scanned(username):
    """
    Get recently scanned books for a user, ordered by timestamp.
    
    Returns all scanned books even if the book details are no longer
    in the database, showing "Unknown" for missing information.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: List of recently scanned books with details and timestamps
        200: Empty array if user not found or has no scans
        500: Database error
    """
    username = unquote(username)
    print(f"[DEBUG] get_recently_scanned called with username: '{username}'")
    
    try:
        session = SessionLocal()
    except Exception as e:
        print(f"[DEBUG] Failed to create session: {e}")
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            print(f"[DEBUG] User '{username}' not found in database - returning empty array")
            session.close()
            return jsonify([]), 200

        print(f"[DEBUG] User '{username}' found with ID: {user.id}")

        # Get all user scans ordered by most recent first
        user_scans = session.query(UserScan).filter(
            UserScan.user_id == user.id
        ).order_by(desc(UserScan.timestamp)).all()

        print(f"[DEBUG] Found {len(user_scans)} scans for user '{username}'")

        if not user_scans:
            print(f"[DEBUG] Returning empty array for user '{username}'")
            session.close()
            return jsonify([]), 200

        result = []
        for scan in user_scans:
            print(f"[DEBUG] Processing scan: ISBN={scan.isbn}, timestamp={scan.timestamp}")
            
            # Try to find the book details
            book = session.query(Book).filter_by(isbn=scan.isbn).first()
            
            if book:
                result.append({
                    "isbn": book.isbn,
                    "title": book.title,
                    "authors": book.authors,
                    "cover_url": book.cover_url,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                })
                print(f"[DEBUG] Added book: {book.title}")
            else:
                # Book not found in database, but still show the scan
                result.append({
                    "isbn": scan.isbn,
                    "title": f"Book {scan.isbn}",
                    "authors": "Unknown",
                    "cover_url": None,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                })
                print(f"[DEBUG] Book with ISBN {scan.isbn} not found in Book table")

        print(f"[DEBUG] Returning {len(result)} results")
        session.close()
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[DEBUG] Error in get_recently_scanned: {e}")
        print(f"[DEBUG] Exception type: {type(e)}")
        print(f"[DEBUG] Exception args: {e.args}")
        session.close()
        return jsonify({"error": str(e)}), 500


@users_api.route("/api/debug/user/<username>", methods=["GET"])
def debug_user_info(username):
    """
    Debug endpoint to inspect user and scan information.
    
    Provides detailed information about a user's scan history and
    overall database statistics for troubleshooting.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: Debug information including user details, scans, and system stats
        500: Database error
    """
    username = unquote(username)
    print(f"[DEBUG] debug_user_info called with username: '{username}'")
    
    try:
        session = SessionLocal()
    except Exception as e:
        print(f"[DEBUG] Failed to create session in debug endpoint: {e}")
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        # Check user existence and details
        user = session.query(User).filter_by(username=username).first()
        user_info = {"exists": False, "id": None, "scans": []}
        
        if user:
            user_info["exists"] = True
            user_info["id"] = user.id
            
            # Get all scans for this user
            scans = session.query(UserScan).filter_by(user_id=user.id).all()
            user_info["scans"] = [
                {
                    "isbn": scan.isbn,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                }
                for scan in scans
            ]
        
        # Get system statistics
        total_users = session.query(User).count()
        total_scans = session.query(UserScan).count()
        
        result = {
            "username": username,
            "user_info": user_info,
            "total_users": total_users,
            "total_scans": total_scans,
            "all_users": [{"id": u.id, "username": u.username} for u in session.query(User).all()]
        }
        
        session.close()
        return jsonify(result), 200
    except Exception as e:
        print(f"[DEBUG] Error in debug_user_info: {e}")
        session.close()
        return jsonify({"error": str(e)}), 500


@users_api.route("/api/users/<username>", methods=["DELETE"])
def delete_user(username):
    """
    Delete a user and all associated data.
    
    Cascades to delete:
    - All user's collections and their books
    - All user's scan history
    - The user account itself
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: User deleted successfully
        404: User not found
    """
    username = unquote(username)
    session = SessionLocal()
    
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    # Delete all collections and their books for this user
    collections = session.query(Collection).filter_by(owner=user.id).all()
    for collection in collections:
        # Delete all books in this collection
        session.query(CollectionBook).filter_by(collection_id=collection.id).delete()
        # Delete the collection itself
        session.delete(collection)

    # Delete user scans
    session.query(UserScan).filter_by(user_id=user.id).delete()
    
    # Delete user account
    session.delete(user)
    session.commit()
    session.close()
    
    return jsonify({"message": f"User '{username}' deleted."}), 200
