from flask import Blueprint, jsonify, request, send_file, url_for
from utils.db_models import SessionLocal, Book, PendingBook, ScanLog, AppLog, DailyStats, calculate_daily_stats, User, UserScan
import datetime
import os
from sqlalchemy import func
import subprocess
import random
import glob
from datetime import date, timedelta

admin_api = Blueprint("admin_api", __name__)

WORKER_PROCESSES = {
    "book_worker": {
        "script": "worker.py",
        "process": None
    },
    "merge_collection_worker": {  # <-- Add this block
        "script": "merge_collection_worker.py",
        "process": None
    },
    # Ajoute d'autres workers ici si besoin
}

@admin_api.route("/admin/api/stats")
def stats():
    session = SessionLocal()
    books = session.query(Book).count()
    pending = session.query(PendingBook).count()
    scans = session.query(ScanLog).count()
    suggestions = 0
    session.close()
    return jsonify({
        "books": books,
        "pending": pending,
        "scans": scans,
        "suggestions": suggestions
    })

@admin_api.route("/admin/api/activity")
def activity():
    session = SessionLocal()
    today = date.today()
    data = []
    
    for i in range(7):
        day = today - timedelta(days=6 - i)
        
        # Try to get daily stats first
        daily_stat = session.query(DailyStats).filter_by(date=day).first()
        
        if daily_stat:
            # Use stored daily stats
            data.append({
                "date": day.strftime("%Y-%m-%d"),
                "books": daily_stat.books_added_today,
                "scans": daily_stat.barcode_scans_today + daily_stat.image_scans_today,
                "suggestions": daily_stat.successful_scans_today,
                "users": daily_stat.active_users_today,
                "collections": daily_stat.collections_added_today
            })
        else:
            # Fallback to old method if no daily stats
            scan_count = session.query(func.count(ScanLog.id)).filter(
                func.date(ScanLog.timestamp) == day
            ).scalar()
            
            book_count = session.query(func.count(Book.isbn)).filter(
                func.date(Book.publication_date) == day.strftime("%Y-%m-%d")
            ).scalar() if hasattr(Book, "publication_date") else 0
            
            suggestions_count = 0
            
            data.append({
                "date": day.strftime("%Y-%m-%d"),
                "books": book_count,
                "scans": scan_count,
                "suggestions": suggestions_count,
                "users": 0,
                "collections": 0
            })
    
    session.close()
    return jsonify(data)

@admin_api.route("/admin/api/daily-stats")
def daily_stats():
    """Get detailed daily statistics"""
    days = int(request.args.get("days", 30))
    session = SessionLocal()
    
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    stats = session.query(DailyStats).filter(
        DailyStats.date >= start_date,
        DailyStats.date <= end_date
    ).order_by(DailyStats.date.desc()).all()
    
    data = []
    for stat in stats:
        data.append({
            "date": stat.date.isoformat(),
            "total_books": stat.total_books,
            "total_users": stat.total_users,
            "total_collections": stat.total_collections,
            "books_added_today": stat.books_added_today,
            "users_added_today": stat.users_added_today,
            "collections_added_today": stat.collections_added_today,
            "barcode_scans_today": stat.barcode_scans_today,
            "image_scans_today": stat.image_scans_today,
            "successful_scans_today": stat.successful_scans_today,
            "failed_scans_today": stat.failed_scans_today,
            "pending_books_today": stat.pending_books_today,
            "worker_errors_today": stat.worker_errors_today,
            "active_users_today": stat.active_users_today
        })
    
    session.close()
    return jsonify(data)

@admin_api.route("/admin/api/calculate-daily-stats", methods=["POST"])
def trigger_daily_stats_calculation():
    """Manually trigger daily stats calculation for today or a specific date"""
    data = request.get_json() or {}
    target_date_str = data.get("date")
    
    if target_date_str:
        try:
            target_date = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        target_date = date.today()
    
    daily_stat = calculate_daily_stats(target_date)
    
    if daily_stat:
        # Access all attributes while the session might still be active
        stats_data = {
            "total_books": daily_stat.total_books,
            "total_users": daily_stat.total_users,
            "total_collections": daily_stat.total_collections,
            "active_users_today": daily_stat.active_users_today,
            "successful_scans_today": daily_stat.successful_scans_today,
            "barcode_scans_today": daily_stat.barcode_scans_today,
            "image_scans_today": daily_stat.image_scans_today,
            "failed_scans_today": daily_stat.failed_scans_today,
            "books_added_today": daily_stat.books_added_today
        }
        
        return jsonify({
            "message": f"Daily stats calculated for {target_date}",
            "date": target_date.isoformat(),
            "stats": stats_data
        })
    else:
        return jsonify({"error": "Failed to calculate daily stats"}), 500

@admin_api.route("/admin/api/logs")
def logs():
    limit = int(request.args.get("limit", 10))
    session = SessionLocal()
    logs = (
        session.query(AppLog)
        .order_by(AppLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    session.close()
    
    # Format logs for the frontend
    formatted_logs = []
    for log in logs:
        formatted_logs.append(
            f"{log.timestamp.strftime('%Y-%m-%d %H:%M:%S')} [{log.level}] {log.message}"
        )
    
    # Return formatted logs or empty list if no logs
    return jsonify(formatted_logs if formatted_logs else [])

@admin_api.route("/admin/api/workers/status")
def workers_status():
    status = {}
    for wid, info in WORKER_PROCESSES.items():
        running = info["process"] is not None and info["process"].poll() is None
        status[wid] = {"name": wid, "running": running}
    return jsonify(status)

@admin_api.route("/admin/api/workers/<worker_id>/start", methods=["POST"])
def worker_start(worker_id):
    info = WORKER_PROCESSES.get(worker_id)
    if not info:
        return jsonify({"error": "Unknown worker"}), 404
    if info["process"] is not None and info["process"].poll() is None:
        return jsonify({"message": "Already running"}), 200
    # Start worker subprocess
    script_path = os.path.join(os.path.dirname(__file__), "..", info["script"])
    proc = subprocess.Popen(["python", script_path])
    info["process"] = proc
    return jsonify({"message": "Started"}), 200

@admin_api.route("/admin/api/workers/<worker_id>/stop", methods=["POST"])
def worker_stop(worker_id):
    info = WORKER_PROCESSES.get(worker_id)
    if not info or info["process"] is None:
        return jsonify({"error": "Worker not started"}), 400
    info["process"].terminate()
    info["process"] = None
    return jsonify({"message": "Stopped"}), 200

# Générer un code-barres pour un ISBN13 existant
@admin_api.route("/admin/api/barcode/<isbn>")
def barcode_for_isbn(isbn):
    # Utilise python-barcode pour générer un PNG en mémoire
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    return send_file(rv, mimetype="image/png")

# Générer un code-barres pour un ISBN13 aléatoire non présent en base
@admin_api.route("/admin/api/barcode/random")
def barcode_random():
    session = SessionLocal()
    # Génère un ISBN13 aléatoire qui n'est pas en base
    while True:
        isbn = "978" + "".join(str(random.randint(0, 9)) for _ in range(10))
        exists = session.query(Book).filter_by(isbn13=isbn).first()
        if not exists:
            break
    session.close()
    # Génère le code-barres
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    # Pour l'UI, on retourne une URL temporaire (tu peux aussi servir l'image en base64 si besoin)
    from flask import url_for
    # On va servir l'image directement
    return jsonify({
        "isbn": isbn,
        "url": url_for('admin_api.barcode_for_isbn', isbn=isbn, _external=True)
    })

# Afficher une cover au hasard
@admin_api.route("/admin/api/covers/random")
def random_cover():
    covers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "covers"))
    files = glob.glob(os.path.join(covers_dir, "*.jpg"))
    if not files:
        return jsonify({"error": "No covers found"}), 404
    file = random.choice(files)
    filename = os.path.basename(file)
    url = f"/cover/{filename}"
    return jsonify({"url": url})

@admin_api.route("/admin/api/testing/random_isbn13")
def testing_random_isbn13():
    session = SessionLocal()
    # Take a random ISBN13 from the books table
    row = session.query(Book.isbn13).filter(Book.isbn13 != None).order_by(func.rand()).first()
    session.close()
    if not row or not row[0]:
        return jsonify({"error": "No ISBN13 found"}), 404
    isbn = row[0]
    # Generate barcode
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    # Return URL for the UI
    url = url_for('admin_api.testing_barcode_image', isbn=isbn, _external=True)
    return jsonify({"isbn": isbn, "url": url})

@admin_api.route("/admin/api/testing/random_isbn13_unknown")
def testing_random_isbn13_unknown():
    session = SessionLocal()
    # Generate a random ISBN13 that's not in the database
    while True:
        isbn = "978" + "".join(str(random.randint(0, 9)) for _ in range(10))
        exists = session.query(Book).filter_by(isbn13=isbn).first()
        if not exists:
            break
    session.close()
    # Generate barcode
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    url = url_for('admin_api.testing_barcode_image', isbn=isbn, _external=True)
    return jsonify({"isbn": isbn, "url": url})

@admin_api.route("/admin/api/testing/barcode/<isbn>")
def testing_barcode_image(isbn):
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    return send_file(rv, mimetype="image/png")

@admin_api.route("/admin/api/testing/random_cover")
def testing_random_cover():
    session = SessionLocal()
    # Take a random ISBN10 from the books table
    row = session.query(Book.isbn).filter(Book.isbn != None).order_by(func.rand()).first()
    session.close()
    if not row or not row[0]:
        return jsonify({"error": "No ISBN found"}), 404
    isbn = row[0]
    covers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "covers"))
    cover_path = os.path.join(covers_dir, f"{isbn}.jpg")
    if not os.path.exists(cover_path):
        return jsonify({"error": "No cover found for this ISBN"}), 404
    
    # Build URL exactly like frontend: ${API_BASE_URL}/cover/${isbn}.jpg
    from flask import request
    server_url = request.url_root.rstrip('/')  # Get base server URL
    url = f"{server_url}/cover/{isbn}.jpg"
    return jsonify({"isbn": isbn, "url": url})

@admin_api.route("/admin/api/today-details")
def today_details():
    """Get detailed information for today's statistics tooltips"""
    session = SessionLocal()
    today = date.today()
    start_datetime = datetime.datetime.combine(today, datetime.datetime.min.time())
    end_datetime = datetime.datetime.combine(today + timedelta(days=1), datetime.datetime.min.time())
    
    # Today's scanned books (from scan logs) - ALL scans
    scanned_books = session.query(ScanLog).filter(
        ScanLog.timestamp >= start_datetime,
        ScanLog.timestamp < end_datetime,
        ScanLog.isbn.isnot(None)
    ).order_by(ScanLog.timestamp.desc()).all()
    
    scanned_books_details = []
    for scan in scanned_books:
        book = session.query(Book).filter_by(isbn=scan.isbn).first()
        if book:
            scanned_books_details.append({
                "isbn": book.isbn,
                "title": book.title,
                "authors": book.authors,
                "time": scan.timestamp.strftime("%H:%M")
            })
    
    # Books added today - Use the new date_added column for accurate counting
    added_books = session.query(Book).filter(
        Book.date_added >= start_datetime,
        Book.date_added < end_datetime
    ).order_by(Book.date_added.desc()).all()
    
    added_books_details = []
    for book in added_books:
        added_books_details.append({
            "isbn": book.isbn,
            "title": book.title,
            "authors": book.authors,
            "time": book.date_added.strftime("%H:%M") if book.date_added else "Unknown"
        })
    
    # Active users today
    active_users = session.query(UserScan.user_id).filter(
        UserScan.timestamp >= start_datetime,
        UserScan.timestamp < end_datetime
    ).distinct().all()
    
    active_users_details = []
    for user_id_tuple in active_users:
        user = session.query(User).filter_by(id=user_id_tuple[0]).first()
        if user:
            scan_count = session.query(UserScan).filter(
                UserScan.user_id == user.id,
                UserScan.timestamp >= start_datetime,
                UserScan.timestamp < end_datetime
            ).count()
            active_users_details.append({
                "username": user.username,
                "scan_count": scan_count
            })
    
    # Collections added today
    collections_logs = session.query(AppLog).filter(
        AppLog.timestamp >= start_datetime,
        AppLog.timestamp < end_datetime,
        AppLog.level == "SUCCESS",
        AppLog.message.like("%Collection created:%")
    ).order_by(AppLog.timestamp.desc()).all()
    
    collections_details = []
    for log in collections_logs:
        # Extract collection name from log message
        message_parts = log.message.split("'")
        collection_name = message_parts[1] if len(message_parts) >= 2 else "Unknown"
        
        # Try to get username from context
        username = "Unknown"
        if log.context and isinstance(log.context, dict):
            username = log.context.get("username", "Unknown")
        
        collections_details.append({
            "name": collection_name,
            "username": username,
            "time": log.timestamp.strftime("%H:%M")
        })
    
    session.close()
    
    return jsonify({
        "scanned_books": scanned_books_details[:10],  # All scans (with duplicates)
        "added_books": added_books_details[:10],      # Only books actually added today
        "active_users": active_users_details,
        "collections": collections_details
    })
