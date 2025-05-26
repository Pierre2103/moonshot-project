from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from utils.db_models import SessionLocal, User, UserScan
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
