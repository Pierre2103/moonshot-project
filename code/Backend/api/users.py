from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError, OperationalError, TimeoutError
from sqlalchemy import desc
from utils.db_models import SessionLocal, User, UserScan, Book, Collection, CollectionBook
from datetime import datetime
import time
import random
from urllib.parse import unquote

users_api = Blueprint("users_api", __name__)

def retry_db_operation(operation, max_retries=3, base_delay=0.1):
    """Retry database operations with exponential backoff"""
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

@users_api.route("/api/users", methods=["POST"])
def create_user():
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
    session = SessionLocal()
    users = session.query(User).all()
    result = [{"id": u.id, "username": u.username} for u in users]
    session.close()
    return jsonify(result)

@users_api.route("/api/user_scans", methods=["POST"])
def add_user_scan():
    data = request.get_json()
    username = data.get("username")
    isbn = data.get("isbn")
    if not username or not isbn:
        return jsonify({"error": "username and isbn are required"}), 400

    def db_operation():
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(username=username).first()
            if not user:
                # Auto-create user if it doesn't exist
                user = User(username=username)
                session.add(user)
                session.commit()

            scan = UserScan(user_id=user.id, isbn=isbn, timestamp=datetime.utcnow())
            session.add(scan)
            session.commit()
            return {"success": True, "status": 201}
        except IntegrityError:
            session.rollback()
            return {"error": "Scan already exists", "status": 409}
        except (OperationalError, TimeoutError) as e:
            session.rollback()
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
    # URL decode the username to handle spaces and special characters
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

        # Debug: Check what's in the UserScan table for this user
        all_scans = session.query(UserScan).filter(UserScan.user_id == user.id).all()
        print(f"[DEBUG] Found {len(all_scans)} total scans for user {user.id}")
        for scan in all_scans:
            print(f"[DEBUG] Scan - ISBN: {scan.isbn}, timestamp: {scan.timestamp}")

        # If no scans found, check if there are any scans in the database at all
        if len(all_scans) == 0:
            total_scans = session.query(UserScan).count()
            print(f"[DEBUG] No scans for user, but {total_scans} total scans exist in database")
            
            # Check if user was just created
            all_users = session.query(User).all()
            print(f"[DEBUG] Users in database: {[(u.id, u.username) for u in all_users]}")

        # First, get all user scans regardless of book existence
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
            
            # Try to find the book
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
                # Book not found in database, but we still want to show the scan
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
    """Debug endpoint to check user and scan information"""
    username = unquote(username)
    print(f"[DEBUG] debug_user_info called with username: '{username}'")
    
    try:
        session = SessionLocal()
    except Exception as e:
        print(f"[DEBUG] Failed to create session in debug endpoint: {e}")
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        # Check user
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
        
        # Get total counts
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
    # Delete user
    session.delete(user)
    session.commit()
    session.close()
    return jsonify({"message": f"User '{username}' deleted."}), 200
