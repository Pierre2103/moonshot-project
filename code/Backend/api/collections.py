from flask import Blueprint, request, jsonify
from utils.db_models import SessionLocal, User, Collection, CollectionBook, UserScan, Book
import random

collections_api = Blueprint("collections", __name__)

@collections_api.route("/api/collections/<username>", methods=["GET"])
def get_collections(username):
    session = SessionLocal()
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    collections = session.query(Collection).filter_by(owner=user.id).all()
    result = [
        {"id": c.id, "name": c.name, "icon": c.icon}
        for c in collections
    ]
    session.close()
    return jsonify(result)

@collections_api.route("/api/collections/<username>", methods=["POST"])
def create_collection(username):
    data = request.json
    name = data.get("name")
    icon = data.get("icon")
    if not name or not icon:
        return jsonify({"error": "Missing name or icon"}), 400
    session = SessionLocal()
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    collection = Collection(name=name, owner=user.id, icon=icon)
    session.add(collection)
    session.commit()
    result = {"id": collection.id, "name": collection.name, "icon": collection.icon}
    session.close()
    return jsonify(result), 201

@collections_api.route("/api/collections/<username>/<int:collection_id>/add", methods=["POST"])
def add_book_to_collection(username, collection_id):
    data = request.json
    isbn = data.get("isbn")
    if not isbn:
        return jsonify({"error": "Missing ISBN"}), 400
    session = SessionLocal()
    user = session.query(User).filter_by(username=username).first()
    collection = session.query(Collection).filter_by(id=collection_id, owner=user.id).first() if user else None
    if not user or not collection:
        session.close()
        return jsonify({"error": "User or collection not found"}), 404
    # Check if already in collection
    exists = session.query(CollectionBook).filter_by(collection_id=collection_id, isbn=isbn).first()
    if exists:
        session.close()
        return jsonify({"message": "Book already in collection"}), 200
    cb = CollectionBook(collection_id=collection_id, isbn=isbn)
    session.add(cb)
    session.commit()
    session.close()
    return jsonify({"message": "Book added to collection"}), 201

@collections_api.route("/api/recently_scanned/<username>", methods=["GET"])
def get_recently_scanned(username):
    session = SessionLocal()
    user = session.query(User).filter_by(username=username).first()
    if not user:
        session.close()
        return jsonify({"error": "User not found"}), 404
    scans = (
        session.query(UserScan)
        .filter_by(user_id=user.id)
        .order_by(UserScan.timestamp.desc())
        .limit(10)
        .all()
    )
    books = []
    for scan in scans:
        book = session.query(Book).filter_by(isbn=scan.isbn).first()
        if book:
            books.append({
                "isbn": book.isbn,
                "title": book.title,
                "cover_url": book.cover_url,
                "authors": book.authors,
            })
    session.close()
    return jsonify(books)

@collections_api.route("/api/collections/<int:collection_id>/books", methods=["GET"])
def get_books_in_collection(collection_id):
    session = SessionLocal()
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
