"""
Administrative API

Comprehensive admin interface providing:
- System statistics and analytics
- Daily activity monitoring
- Worker process management
- Testing utilities for development
- User management tools
- Database analytics and insights

This API is intended for administrators and includes powerful tools
for monitoring system health, analyzing usage patterns, and managing
the application ecosystem.
"""

from flask import Blueprint, jsonify, request, send_file, url_for
from utils.db_models import SessionLocal, Book, PendingBook, ScanLog, AppLog, DailyStats, calculate_daily_stats, User, UserScan
import datetime
import os
from sqlalchemy import func, text
import subprocess
import random
import glob
from datetime import date, timedelta
from urllib.parse import unquote

admin_api = Blueprint("admin_api", __name__)


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Log application events for admin operations.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
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


# Worker process registry for management
WORKER_PROCESSES = {
    "book_worker": {
        "script": "worker.py",
        "process": None
    },
    "merge_collection_worker": {
        "script": "merge_collection_worker.py",
        "process": None
    },
    # Add additional workers here as needed
}


@admin_api.route("/admin/api/stats")
def stats():
    """
    Get basic system statistics.
    
    Returns:
        200: Current counts of books, pending items, scans, and suggestions
    """
    session = SessionLocal()
    books = session.query(Book).count()
    pending = session.query(PendingBook).count()
    scans = session.query(ScanLog).count()
    suggestions = 0  # Legacy field, could be calculated if needed
    session.close()
    
    return jsonify({
        "books": books,
        "pending": pending,
        "scans": scans,
        "suggestions": suggestions
    })


@admin_api.route("/admin/api/activity")
def activity():
    """
    Get 7-day activity overview for dashboard charts.
    
    Uses stored daily stats when available, falls back to real-time
    calculation for missing data.
    
    Returns:
        200: Array of daily activity data for the past 7 days
    """
    session = SessionLocal()
    today = date.today()
    data = []
    
    for i in range(7):
        day = today - timedelta(days=6 - i)
        
        # Try to get pre-calculated daily stats first
        daily_stat = session.query(DailyStats).filter_by(date=day).first()
        
        if daily_stat:
            # Use efficient stored daily stats
            data.append({
                "date": day.strftime("%Y-%m-%d"),
                "books": daily_stat.books_added_today,
                "scans": daily_stat.barcode_scans_today + daily_stat.image_scans_today,
                "suggestions": daily_stat.successful_scans_today,
                "users": daily_stat.active_users_today,
                "collections": daily_stat.collections_added_today
            })
        else:
            # Fallback to real-time calculation if no daily stats
            scan_count = session.query(func.count(ScanLog.id)).filter(
                func.date(ScanLog.timestamp) == day
            ).scalar()
            
            # Note: publication_date is not a reliable indicator of when books were added
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
    """
    Get detailed daily statistics for analytics dashboard.
    
    Query parameters:
        days: Number of days to retrieve (default: 30)
        
    Returns:
        200: Array of detailed daily statistics ordered by date (newest first)
    """
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
    """
    Manually trigger daily statistics calculation.
    
    JSON payload (optional):
        {"date": "YYYY-MM-DD"}  # Specific date, defaults to today
        
    Returns:
        200: Calculation successful with computed stats
        400: Invalid date format
        500: Calculation failed
    """
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
        # Extract computed statistics while session is active
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
    """
    Get recent application logs for debugging.
    
    Query parameters:
        limit: Number of log entries to return (default: 10)
        
    Returns:
        200: Array of formatted log strings (newest first)
    """
    limit = int(request.args.get("limit", 10))
    session = SessionLocal()
    
    logs = (
        session.query(AppLog)
        .order_by(AppLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    session.close()
    
    # Format logs for frontend display
    formatted_logs = []
    for log in logs:
        formatted_logs.append(
            f"{log.timestamp.strftime('%Y-%m-%d %H:%M:%S')} [{log.level}] {log.message}"
        )
    
    return jsonify(formatted_logs if formatted_logs else [])


@admin_api.route("/admin/api/workers/status")
def workers_status():
    """
    Get status of all registered worker processes.
    
    Returns:
        200: Dictionary mapping worker IDs to their status
    """
    status = {}
    for wid, info in WORKER_PROCESSES.items():
        # Check if process is actually running (not just started)
        running = info["process"] is not None and info["process"].poll() is None
        status[wid] = {"name": wid, "running": running}
    return jsonify(status)


@admin_api.route("/admin/api/workers/<worker_id>/start", methods=["POST"])
def worker_start(worker_id):
    """
    Start a specific worker process.
    
    Args:
        worker_id: ID of the worker to start
        
    Returns:
        200: Worker started or already running
        404: Unknown worker ID
    """
    info = WORKER_PROCESSES.get(worker_id)
    if not info:
        return jsonify({"error": "Unknown worker"}), 404
    
    # Check if already running
    if info["process"] is not None and info["process"].poll() is None:
        return jsonify({"message": "Already running"}), 200
    
    # Start worker subprocess
    script_path = os.path.join(os.path.dirname(__file__), "..", info["script"])
    proc = subprocess.Popen(["python", script_path])
    info["process"] = proc
    
    return jsonify({"message": "Started"}), 200


@admin_api.route("/admin/api/workers/<worker_id>/stop", methods=["POST"])
def worker_stop(worker_id):
    """
    Stop a running worker process.
    
    Args:
        worker_id: ID of the worker to stop
        
    Returns:
        200: Worker stopped successfully
        400: Worker not running or unknown ID
    """
    info = WORKER_PROCESSES.get(worker_id)
    if not info or info["process"] is None:
        return jsonify({"error": "Worker not started"}), 400
    
    info["process"].terminate()
    info["process"] = None
    
    return jsonify({"message": "Stopped"}), 200


# === TESTING UTILITIES ===

@admin_api.route("/admin/api/barcode/<isbn>")
def barcode_for_isbn(isbn):
    """
    Generate barcode image for a specific ISBN.
    
    Args:
        isbn: ISBN-13 to generate barcode for
        
    Returns:
        200: PNG barcode image
    """
    import io
    import barcode
    from barcode.writer import ImageWriter
    
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    
    return send_file(rv, mimetype="image/png")


@admin_api.route("/admin/api/barcode/random")
def barcode_random():
    """
    Generate barcode for a random ISBN not in database.
    
    Useful for testing barcode scanning with unknown books.
    
    Returns:
        200: JSON with generated ISBN and barcode URL
    """
    session = SessionLocal()
    
    # Generate random ISBN13 not in database
    while True:
        isbn = "978" + "".join(str(random.randint(0, 9)) for _ in range(10))
        exists = session.query(Book).filter_by(isbn13=isbn).first()
        if not exists:
            break
    session.close()
    
    return jsonify({
        "isbn": isbn,
        "url": url_for('admin_api.barcode_for_isbn', isbn=isbn, _external=True)
    })


@admin_api.route("/admin/api/covers/random")
def random_cover():
    """
    Get URL for a random book cover from the covers directory.
    
    Returns:
        200: JSON with cover URL
        404: No covers found
    """
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
    """
    Get a random ISBN13 from the database for testing.
    
    Returns:
        200: JSON with ISBN and barcode URL
        404: No ISBN13 found in database
    """
    session = SessionLocal()
    
    # Get random ISBN13 from existing books
    row = session.query(Book.isbn13).filter(Book.isbn13 != None).order_by(func.rand()).first()
    session.close()
    
    if not row or not row[0]:
        return jsonify({"error": "No ISBN13 found"}), 404
    
    isbn = row[0]
    url = url_for('admin_api.testing_barcode_image', isbn=isbn, _external=True)
    
    return jsonify({"isbn": isbn, "url": url})


@admin_api.route("/admin/api/testing/random_isbn13_unknown")
def testing_random_isbn13_unknown():
    """
    Generate a random ISBN13 that doesn't exist in the database.
    
    Useful for testing the pending book queue workflow.
    
    Returns:
        200: JSON with unknown ISBN and barcode URL
    """
    session = SessionLocal()
    
    # Generate random ISBN13 not in database
    while True:
        isbn = "978" + "".join(str(random.randint(0, 9)) for _ in range(10))
        exists = session.query(Book).filter_by(isbn13=isbn).first()
        if not exists:
            break
    session.close()
    
    url = url_for('admin_api.testing_barcode_image', isbn=isbn, _external=True)
    
    return jsonify({"isbn": isbn, "url": url})


@admin_api.route("/admin/api/testing/barcode/<isbn>")
def testing_barcode_image(isbn):
    """
    Generate and serve barcode image for testing.
    
    Args:
        isbn: ISBN to generate barcode for
        
    Returns:
        200: PNG barcode image
    """
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
    """
    Get a random book cover from existing books for testing.
    
    Returns:
        200: JSON with ISBN and cover URL
        404: No covers found
    """
    session = SessionLocal()
    
    # Get random ISBN10 from books table
    row = session.query(Book.isbn).filter(Book.isbn != None).order_by(func.rand()).first()
    session.close()
    
    if not row or not row[0]:
        return jsonify({"error": "No ISBN found"}), 404
    
    isbn = row[0]
    covers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "covers"))
    cover_path = os.path.join(covers_dir, f"{isbn}.jpg")
    
    if not os.path.exists(cover_path):
        return jsonify({"error": "No cover found for this ISBN"}), 404
    
    # Build full URL for frontend
    from flask import request
    server_url = request.url_root.rstrip('/')
    url = f"{server_url}/cover/{isbn}.jpg"
    
    return jsonify({"isbn": isbn, "url": url})


@admin_api.route("/admin/api/today-details")
def today_details():
    """
    Get detailed breakdown of today's activity for dashboard tooltips.
    
    Returns:
        200: Detailed lists of today's books, users, collections, and scans
    """
    session = SessionLocal()
    today = date.today()
    start_datetime = datetime.datetime.combine(today, datetime.datetime.min.time())
    end_datetime = datetime.datetime.combine(today + timedelta(days=1), datetime.datetime.min.time())
    
    # Today's scanned books (from scan logs) - ALL scans including duplicates
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
    
    # Books actually added to database today (using date_added column)
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
    
    # Active users today (users who performed scans)
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
    
    # Collections created today (extracted from app logs)
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
        
        # Extract username from log context
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


# === ANALYTICS ENDPOINTS ===

@admin_api.route("/admin/api/analytics/overview", methods=["GET"])
def analytics_overview():
    """
    Get comprehensive overview analytics for the complete dataset.
    
    Returns:
        200: High-level metrics about the entire book collection
    """
    session = SessionLocal()
    try:
        # Core collection metrics
        total_books = session.query(Book).count()
        total_authors = session.query(func.count(func.distinct(Book.authors))).scalar()
        total_publishers = session.query(func.count(func.distinct(Book.publisher))).filter(Book.publisher.isnot(None)).scalar()
        total_languages = session.query(func.count(func.distinct(Book.language_code))).filter(Book.language_code.isnot(None)).scalar()
        
        # Publication date range
        oldest_book = session.query(func.min(Book.publication_date)).scalar()
        newest_book = session.query(func.max(Book.publication_date)).scalar()
        
        # Content metrics
        total_pages = session.query(func.sum(Book.pages)).filter(Book.pages.isnot(None)).scalar() or 0
        
        return jsonify({
            "total_books": total_books,
            "total_authors": total_authors,
            "total_publishers": total_publishers,
            "total_languages": total_languages,
            "oldest_book": oldest_book,
            "newest_book": newest_book,
            "total_pages": total_pages
        })
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/timeline", methods=["GET"])
def analytics_timeline():
    """
    Get publication timeline data for historical analysis.
    
    Returns:
        200: Array of year/count pairs for publication timeline
    """
    session = SessionLocal()
    try:
        # Extract year from publication_date and count books per year
        timeline_data = session.execute(text("""
            SELECT 
                SUBSTRING(publication_date, -4) as year,
                COUNT(*) as count
            FROM books 
            WHERE publication_date IS NOT NULL 
            AND publication_date REGEXP '[0-9]{4}$'
            GROUP BY year
            ORDER BY year
        """)).fetchall()
        
        return jsonify([
            {"year": row[0], "count": row[1]} 
            for row in timeline_data
        ])
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/authors", methods=["GET"])
def analytics_authors():
    """
    Get top authors by book count.
    
    Query parameters:
        limit: Number of top authors to return (default: 20)
        
    Returns:
        200: Array of author/count pairs sorted by book count
    """
    limit = request.args.get("limit", 20, type=int)
    session = SessionLocal()
    try:
        # Get all books with authors and parse the JSON field
        books_with_authors = session.query(Book.authors).filter(
            Book.authors.isnot(None),
            Book.authors != '[]',
            Book.authors != ''
        ).all()
        
        # Parse authors JSON and count occurrences
        author_counts = {}
        
        for book_authors in books_with_authors:
            authors_field = book_authors[0]
            if not authors_field:
                continue
                
            try:
                # Handle different author field formats
                if isinstance(authors_field, list):
                    authors_list = authors_field
                elif isinstance(authors_field, str):
                    if authors_field.startswith('[') and authors_field.endswith(']'):
                        import json
                        authors_list = json.loads(authors_field)
                    else:
                        # Single author as string
                        authors_list = [authors_field]
                else:
                    continue
                    
                # Count each author
                for author in authors_list:
                    if author and str(author).strip():
                        clean_author = str(author).strip()
                        author_counts[clean_author] = author_counts.get(clean_author, 0) + 1
                        
            except Exception:
                # Fallback: treat as single author string
                try:
                    clean_author = str(authors_field).strip()
                    if clean_author and clean_author != '[]':
                        author_counts[clean_author] = author_counts.get(clean_author, 0) + 1
                except:
                    continue
        
        # Sort by count and limit results
        sorted_authors = sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        return jsonify([
            {"author": author, "book_count": count} 
            for author, count in sorted_authors
        ])
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/languages", methods=["GET"])
def analytics_languages():
    """
    Get language distribution across the book collection.
    
    Returns:
        200: Array of language/count pairs sorted by frequency
    """
    session = SessionLocal()
    try:
        languages_data = session.query(
            Book.language_code,
            func.count(Book.isbn).label('count')
        ).filter(
            Book.language_code.isnot(None)
        ).group_by(Book.language_code).order_by(func.count(Book.isbn).desc()).all()
        
        return jsonify([
            {"language": row[0], "count": row[1]} 
            for row in languages_data
        ])
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/publishers", methods=["GET"])
def analytics_publishers():
    """
    Get top publishers by book count.
    
    Query parameters:
        limit: Number of top publishers to return (default: 20)
        
    Returns:
        200: Array of publisher/count pairs sorted by book count
    """
    limit = request.args.get("limit", 20, type=int)
    session = SessionLocal()
    try:
        publishers_data = session.query(
            Book.publisher,
            func.count(Book.isbn).label('count')
        ).filter(
            Book.publisher.isnot(None)
        ).group_by(Book.publisher).order_by(func.count(Book.isbn).desc()).limit(limit).all()
        
        return jsonify([
            {"publisher": row[0], "count": row[1]} 
            for row in publishers_data
        ])
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/pages", methods=["GET"])
def analytics_pages():
    """
    Get page count distribution and statistics.
    
    Returns:
        200: Page statistics and distribution by ranges
    """
    session = SessionLocal()
    try:
        # Basic page statistics
        page_stats = session.query(
            func.min(Book.pages).label('min_pages'),
            func.max(Book.pages).label('max_pages'),
            func.avg(Book.pages).label('avg_pages'),
            func.count(Book.pages).label('books_with_pages')
        ).filter(Book.pages.isnot(None)).first()
        
        # Page distribution by ranges (compatible with ONLY_FULL_GROUP_BY)
        page_ranges = session.execute(text("""
            SELECT 
                page_range,
                COUNT(*) as count
            FROM (
                SELECT 
                    CASE 
                        WHEN pages < 100 THEN '< 100'
                        WHEN pages < 200 THEN '100-199'
                        WHEN pages < 300 THEN '200-299'
                        WHEN pages < 400 THEN '300-399'
                        WHEN pages < 500 THEN '400-499'
                        ELSE '500+'
                    END as page_range,
                    CASE 
                        WHEN pages < 100 THEN 1
                        WHEN pages < 200 THEN 2
                        WHEN pages < 300 THEN 3
                        WHEN pages < 400 THEN 4
                        WHEN pages < 500 THEN 5
                        ELSE 6
                    END as sort_order
                FROM books 
                WHERE pages IS NOT NULL
            ) as page_groups
            GROUP BY page_range, sort_order
            ORDER BY sort_order
        """)).fetchall()
        
        return jsonify({
            "stats": {
                "min_pages": page_stats[0],
                "max_pages": page_stats[1],
                "avg_pages": round(page_stats[2], 1) if page_stats[2] else 0,
                "books_with_pages": page_stats[3]
            },
            "distribution": [
                {"range": row[0], "count": row[1]} 
                for row in page_ranges
            ]
        })
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/metadata-coverage", methods=["GET"])
def analytics_metadata_coverage():
    """
    Get metadata field coverage statistics.
    
    Shows how complete the book metadata is across all fields.
    
    Returns:
        200: Coverage counts and percentages for each metadata field
    """
    session = SessionLocal()
    try:
        total_books = session.query(Book).count()
        
        # Count non-null values for each metadata field
        coverage_data = {
            "title": session.query(Book).filter(Book.title.isnot(None)).count(),
            "authors": session.query(Book).filter(Book.authors.isnot(None), Book.authors != '[]').count(),
            "isbn13": session.query(Book).filter(Book.isbn13.isnot(None)).count(),
            "pages": session.query(Book).filter(Book.pages.isnot(None)).count(),
            "publication_date": session.query(Book).filter(Book.publication_date.isnot(None)).count(),
            "publisher": session.query(Book).filter(Book.publisher.isnot(None)).count(),
            "language_code": session.query(Book).filter(Book.language_code.isnot(None)).count(),
            "cover_url": session.query(Book).filter(Book.cover_url.isnot(None)).count(),
            "description": session.query(Book).filter(Book.description.isnot(None), Book.description != '').count(),
            "genres": session.query(Book).filter(Book.genres.isnot(None), Book.genres != '[]').count(),
        }
        
        # Calculate coverage percentages
        coverage_percentages = {
            key: round((value / total_books) * 100, 1) if total_books > 0 else 0
            for key, value in coverage_data.items()
        }
        
        return jsonify({
            "total_books": total_books,
            "coverage_counts": coverage_data,
            "coverage_percentages": coverage_percentages
        })
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/calculate", methods=["POST"])
def calculate_analytics():
    """
    Trigger analytics calculation and caching.
    
    Currently returns immediately since analytics are calculated on-demand.
    Could be extended to implement pre-computation and caching.
    
    Returns:
        200: Analytics calculated successfully
        500: Calculation failed
    """
    try:
        log_app("INFO", "Analytics calculation triggered manually")
        return jsonify({
            "message": "Analytics calculated successfully",
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        log_app("ERROR", f"Failed to calculate analytics: {e}")
        return jsonify({"error": "Failed to calculate analytics"}), 500


@admin_api.route("/admin/api/analytics/genres", methods=["GET"])
def analytics_genres():
    """
    Get genre distribution for word cloud visualization.
    
    Returns:
        200: Array of genre/count pairs formatted for word cloud
    """
    session = SessionLocal()
    try:
        # Get all books with genres and parse the JSON field
        books_with_genres = session.query(Book.genres).filter(
            Book.genres.isnot(None),
            Book.genres != '[]',
            Book.genres != ''
        ).all()
        
        # Parse genres JSON and count occurrences
        genre_counts = {}
        
        for book_genres in books_with_genres:
            genres_field = book_genres[0]
            if not genres_field:
                continue
                
            try:
                # Handle different genre field formats
                if isinstance(genres_field, list):
                    genres_list = genres_field
                elif isinstance(genres_field, str):
                    if genres_field.startswith('[') and genres_field.endswith(']'):
                        import json
                        genres_list = json.loads(genres_field)
                    else:
                        # Single genre as string
                        genres_list = [genres_field]
                else:
                    continue
                    
                # Count each genre
                for genre in genres_list:
                    if genre and str(genre).strip():
                        clean_genre = str(genre).strip()
                        genre_counts[clean_genre] = genre_counts.get(clean_genre, 0) + 1
                        
            except Exception:
                # Fallback: treat as single genre string
                try:
                    clean_genre = str(genres_field).strip()
                    if clean_genre and clean_genre != '[]':
                        genre_counts[clean_genre] = genre_counts.get(clean_genre, 0) + 1
                except:
                    continue
        
        # Sort by count and filter out very rare genres
        sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
        
        return jsonify([
            {"text": genre, "value": count} 
            for genre, count in sorted_genres
            if count > 1  # Filter out single-occurrence genres
        ])
    finally:
        session.close()


@admin_api.route("/admin/api/analytics/publication-heatmap", methods=["GET"])
def analytics_publication_heatmap():
    """
    Get publication date heatmap data for calendar visualization.
    Returns:
        200: Array of year/month/count objects for heatmap rendering
    """
    session = SessionLocal()
    try:
        # Get all publication_date values for debugging
        debug_dates = session.query(Book.publication_date).filter(Book.publication_date.isnot(None)).limit(50).all()
        print("DEBUG: Sample publication_date values:", [d[0] for d in debug_dates])

        # Get min and max year in the DB (robustly extract 4-digit years)
        min_year_row = session.execute(text("""
            SELECT MIN(CAST(SUBSTRING(publication_date, 1, 4) AS UNSIGNED)) FROM books
            WHERE publication_date IS NOT NULL AND SUBSTRING(publication_date, 1, 4) REGEXP '^[0-9]{4}$'
        """)).fetchone()
        max_year_row = session.execute(text("""
            SELECT MAX(CAST(SUBSTRING(publication_date, 1, 4) AS UNSIGNED)) FROM books
            WHERE publication_date IS NOT NULL AND SUBSTRING(publication_date, 1, 4) REGEXP '^[0-9]{4}$'
        """)).fetchone()
        min_year = min_year_row[0]
        max_year = max_year_row[0]
        if min_year is None or max_year is None:
            return jsonify([])

        # Get counts for each year/month, including books with only a year (month=NULL)
        heatmap_data = session.execute(text("""
            SELECT 
                CAST(SUBSTRING(publication_date, 1, 4) AS UNSIGNED) as year,
                CASE
                    WHEN LENGTH(publication_date) >= 7 AND SUBSTRING(publication_date, 5, 1) = '-' THEN
                        CAST(SUBSTRING(publication_date, 6, 2) AS UNSIGNED)
                    ELSE NULL
                END as month,
                COUNT(*) as count
            FROM books
            WHERE publication_date IS NOT NULL
            AND SUBSTRING(publication_date, 1, 4) REGEXP '^[0-9]{4}$'
            GROUP BY year, month
            HAVING year IS NOT NULL
            ORDER BY year, month
        """)).fetchall()

        # Debug: print the raw SQL result
        print("DEBUG: Raw heatmap_data:", heatmap_data)

        # Build a lookup for (year, month) -> count
        count_map = {}
        for row in heatmap_data:
            year, month, count = row
            if year and month and 1 <= month <= 12:
                count_map[(int(year), int(month)-1)] = count
            elif year and (month is None):
                # Use month index 12 for "no month"
                count_map[(int(year), 12)] = count

        # Build full grid for all years and months, including "no month" (month=12)
        result = []
        for month in range(13):  # 0-11 = Jan-Dec, 12 = "No Month"
            for year in range(min_year, max_year + 1):
                count = count_map.get((year, month), 0)
                result.append({
                    "year": year,
                    "month": month,
                    "count": count
                })
        return jsonify(result)
    finally:
        session.close()


# === TESTING AND USER MANAGEMENT ===

@admin_api.route("/admin/api/testing/add_isbn", methods=["POST"])
def add_test_isbn():
    """
    Add a test ISBN to the database for development.
    
    JSON payload:
        {"isbn": "9781234567890"}
        
    Returns:
        200: ISBN ensured in database
        400: Missing ISBN
    """
    data = request.get_json()
    isbn = data.get("isbn")
    if not isbn:
        return jsonify({"error": "Missing ISBN"}), 400
    
    session = SessionLocal()
    # Only add if not already present
    exists = session.query(Book).filter_by(isbn13=isbn).first()
    if not exists:
        book = Book(
            isbn=isbn[-10:], 
            isbn13=isbn, 
            title="Test Book", 
            authors="Test Author", 
            publisher="Test Publisher"
        )
        session.add(book)
        session.commit()
    session.close()
    
    return jsonify({"message": f"ISBN {isbn} ensured in database."})


@admin_api.route("/admin/api/testing/delete_isbn/<isbn>", methods=["DELETE"])
def delete_test_isbn(isbn):
    """
    Delete a test ISBN from the database.
    
    Args:
        isbn: ISBN to delete (both ISBN-10 and ISBN-13 versions)
        
    Returns:
        200: ISBN deleted from database
    """
    session = SessionLocal()
    session.query(Book).filter_by(isbn13=isbn).delete()
    session.query(Book).filter_by(isbn=isbn[-10:]).delete()
    session.commit()
    session.close()
    
    return jsonify({"message": f"ISBN {isbn} deleted from database."})


# === USER MANAGEMENT ENDPOINTS ===

@admin_api.route("/admin/api/users", methods=["POST"])
def admin_create_user():
    """
    Admin endpoint to create users for testing.
    
    JSON payload:
        {"username": "test_user"}
        
    Returns:
        201: User created successfully
        400: Missing username
        409: Username already exists
        500: Server error
    """
    data = request.get_json()
    username = data.get("username")
    
    if not username or not username.strip():
        return jsonify({"error": "Username is required"}), 400

    session = SessionLocal()
    try:
        user = User(username=username.strip())
        session.add(user)
        session.commit()
        return jsonify({"id": user.id, "username": user.username}), 201
    except Exception as e:
        session.rollback()
        if "Duplicate entry" in str(e) or "UNIQUE constraint" in str(e):
            return jsonify({"error": "Username already exists"}), 409
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@admin_api.route("/admin/api/users", methods=["GET"])
def admin_list_users():
    """
    Admin endpoint to list all users.
    
    Returns:
        200: Array of all users with id and username
    """
    session = SessionLocal()
    users = session.query(User).all()
    result = [{"id": u.id, "username": u.username} for u in users]
    session.close()
    return jsonify(result)


@admin_api.route("/admin/api/users/<username>", methods=["DELETE"])
def admin_delete_user(username):
    """
    Admin endpoint to delete users and all associated data.
    
    Args:
        username: URL-encoded username to delete
        
    Returns:
        200: User deleted successfully
        404: User not found
    """
    username = unquote(username)
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Cascade delete: collections, collection books, and user scans
        from utils.db_models import Collection, CollectionBook
        collections = session.query(Collection).filter_by(owner=user.id).all()
        for collection in collections:
            session.query(CollectionBook).filter_by(collection_id=collection.id).delete()
            session.delete(collection)

        session.query(UserScan).filter_by(user_id=user.id).delete()
        session.delete(user)
        session.commit()
        
        return jsonify({"message": f"User '{username}' deleted."}), 200
    finally:
        session.close()


@admin_api.route("/admin/api/user_scans", methods=["POST"])
def admin_add_user_scan():
    """
    Admin endpoint to add user scans for testing.
    
    JSON payload:
        {"username": "test_user", "isbn": "1234567890"}
        
    Returns:
        201: Scan added successfully
        400: Missing username or ISBN
        409: Scan already exists
        500: Server error
    """
    data = request.get_json()
    username = data.get("username")
    isbn = data.get("isbn")
    
    if not username or not isbn:
        return jsonify({"error": "username and isbn are required"}), 400

    print(f"Admin API: Adding scan for username='{username}', isbn='{isbn}'")
    
    session = SessionLocal()
    try:
        session.execute(text("SET innodb_lock_wait_timeout=5"))

        # Get or create user
        user = session.query(User).filter_by(username=username).first()
        if not user:
            print(f"Admin API: User '{username}' not found, auto-creating user")
            user = User(username=username)
            session.add(user)
            session.commit()
            print(f"Admin API: Created user '{username}' with ID: {user.id}")

        print(f"Admin API: User '{username}' found with ID: {user.id}")

        # Check for duplicate scan
        existing_scan = session.query(UserScan).filter_by(user_id=user.id, isbn=isbn).first()
        if existing_scan:
            print(f"Admin API: Scan already exists for user {user.id}, isbn {isbn}")
            return jsonify({"error": "Scan already exists"}), 409

        # Create new scan
        scan = UserScan(user_id=user.id, isbn=isbn, timestamp=datetime.datetime.utcnow())
        session.add(scan)
        session.commit()
        
        print(f"Admin API: Successfully added scan for user {user.id}, isbn {isbn}")
        return jsonify({"success": True}), 201
    except Exception as e:
        session.rollback()
        print(f"Admin API: Error adding scan: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()


@admin_api.route("/admin/api/user_scans/<username>", methods=["DELETE"])
def admin_delete_user_scans(username):
    """
    Admin endpoint to delete all scans for a user.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: All scans deleted successfully
        404: User not found
    """
    username = unquote(username)
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        session.query(UserScan).filter_by(user_id=user.id).delete()
        session.commit()
        return jsonify({"message": "All scan history deleted"}), 200
    finally:
        session.close()


@admin_api.route("/admin/api/recently_scanned/<username>", methods=["GET"])
def admin_get_recently_scanned(username):
    """
    Admin endpoint to get recently scanned books for a user.
    
    Args:
        username: URL-encoded username
        
    Returns:
        200: List of recently scanned books with details
        500: Server error
    """
    username = unquote(username)
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(username=username).first()
        if not user:
            return jsonify([]), 200

        # Get user scans ordered by most recent
        user_scans = session.query(UserScan).filter(
            UserScan.user_id == user.id
        ).order_by(UserScan.timestamp.desc()).all()

        if not user_scans:
            return jsonify([]), 200

        result = []
        for scan in user_scans:
            book = session.query(Book).filter_by(isbn=scan.isbn).first()
            
            if book:
                result.append({
                    "isbn": book.isbn,
                    "title": book.title,
                    "authors": book.authors,
                    "cover_url": book.cover_url,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                })
            else:
                # Show scan even if book is not found
                result.append({
                    "isbn": scan.isbn,
                    "title": f"Book {scan.isbn}",
                    "authors": "Unknown",
                    "cover_url": None,
                    "timestamp": scan.timestamp.isoformat() if scan.timestamp else None
                })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()
