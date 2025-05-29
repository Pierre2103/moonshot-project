from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc
from utils.db_models import SessionLocal, User, UserScan, Book, Collection, CollectionBook
from datetime import datetime

users_api = Blueprint("users_api", __name__)

@users_api.route("/users", methods=["POST"])
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

@users_api.route("/users", methods=["GET"])
def list_users():
    session = SessionLocal()
    users = session.query(User).all()
    result = [{"id": u.id, "username": u.username} for u in users]
    session.close()
    return jsonify(result)

@users_api.route("/user_scans", methods=["POST"])
def add_user_scan():
    data = request.get_json()
    username = data.get("username")
    isbn = data.get("isbn")
    if not username or not isbn:
        return jsonify({"error": "username and isbn are required"}), 400

    session = SessionLocal()
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404

    scan = UserScan(user_id=user.id, isbn=isbn, timestamp=datetime.utcnow())
    session.add(scan)
    try:
        session.commit()
        return jsonify({"success": True}), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Scan already exists"}), 409
    finally:
        session.close()

@users_api.route("/user_scans/<username>", methods=["DELETE"])
def delete_user_scans(username):
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

@users_api.route("/recently_scanned/<username>", methods=["GET"])
def get_recently_scanned(username):
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            print(f"User '{username}' not found in database")
            return jsonify([]), 200

        print(f"User '{username}' found with ID: {user.id}")

        # First, get all user scans regardless of book existence
        user_scans = session.query(UserScan).filter(
            UserScan.user_id == user.id
        ).order_by(desc(UserScan.timestamp)).all()

        print(f"Found {len(user_scans)} scans for user '{username}'")

        if not user_scans:
            return jsonify([]), 200

        result = []
        for scan in user_scans:
            print(f"Processing scan: ISBN={scan.isbn}, timestamp={scan.timestamp}")
            
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
                print(f"Added book: {book.title}")
            else:
                # Book not found in database, but we still want to show the scan
                result.append({
                    "isbn": scan.isbn,
                    "title": f"Book {scan.isbn}",
                    "authors": "Unknown",
                    "cover_url": None,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                })
                print(f"Book with ISBN {scan.isbn} not found in Book table")

        print(f"Returning {len(result)} results")
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in get_recently_scanned: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@users_api.route("/users/<username>", methods=["DELETE"])
def delete_user(username):
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
