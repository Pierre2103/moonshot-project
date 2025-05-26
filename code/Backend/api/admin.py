from flask import Blueprint, jsonify, request, send_file, url_for
from utils.db_models import SessionLocal, Book, PendingBook, ScanLog, AppLog
import datetime
import os
from sqlalchemy import func
import subprocess
import random
import glob

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
    today = datetime.date.today()
    data = []
    for i in range(7):
        day = today - datetime.timedelta(days=6 - i)
        # Nombre de scans ce jour-là
        scan_count = session.query(func.count(ScanLog.id)).filter(
            func.date(ScanLog.timestamp) == day
        ).scalar()
        # Nombre de livres ajoutés ce jour-là
        book_count = session.query(func.count(Book.isbn)).filter(
            func.date(Book.publication_date) == day.strftime("%Y-%m-%d")
        ).scalar() if hasattr(Book, "publication_date") else 0
        # Suggestions (à adapter si tu as une table)
        suggestions_count = 0
        data.append({
            "date": day.strftime("%Y-%m-%d"),
            "books": book_count,
            "scans": scan_count,
            "suggestions": suggestions_count
        })
    session.close()
    return jsonify(data)

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
    # Liste du plus récent (en haut) au plus ancien (en bas)
    return jsonify([
        f"{log.timestamp.strftime('%Y-%m-%d %H:%M:%S')} [{log.level}] {log.message}"
        for log in logs
    ])

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
        return jsonify({"error": "Worker inconnu"}), 404
    if info["process"] is not None and info["process"].poll() is None:
        return jsonify({"message": "Déjà en marche"}), 200
    # Lance le worker en subprocess
    script_path = os.path.join(os.path.dirname(__file__), "..", info["script"])
    proc = subprocess.Popen(["python", script_path])
    info["process"] = proc
    return jsonify({"message": "Démarré"}), 200

@admin_api.route("/admin/api/workers/<worker_id>/stop", methods=["POST"])
def worker_stop(worker_id):
    info = WORKER_PROCESSES.get(worker_id)
    if not info or info["process"] is None:
        return jsonify({"error": "Worker non démarré"}), 400
    info["process"].terminate()
    info["process"] = None
    return jsonify({"message": "Arrêté"}), 200

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
        return jsonify({"error": "Aucune couverture trouvée"}), 404
    file = random.choice(files)
    filename = os.path.basename(file)
    url = f"/cover/{filename}"
    return jsonify({"url": url})

@admin_api.route("/admin/api/testing/random_isbn13")
def testing_random_isbn13():
    session = SessionLocal()
    # Prend un ISBN13 au hasard dans la table books
    row = session.query(Book.isbn13).filter(Book.isbn13 != None).order_by(func.rand()).first()
    session.close()
    if not row or not row[0]:
        return jsonify({"error": "Aucun ISBN13 trouvé"}), 404
    isbn = row[0]
    # Génère le code-barres
    import io
    import barcode
    from barcode.writer import ImageWriter
    rv = io.BytesIO()
    ean = barcode.get('ean13', isbn, writer=ImageWriter())
    ean.write(rv)
    rv.seek(0)
    # Sert l'image directement
    from flask import send_file
    # Pour l'UI, on retourne une URL temporaire
    url = url_for('admin_api.testing_barcode_image', isbn=isbn, _external=True)
    return jsonify({"isbn": isbn, "url": url})

@admin_api.route("/admin/api/testing/random_isbn13_unknown")
def testing_random_isbn13_unknown():
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
    # Prend un ISBN10 au hasard dans la table books
    row = session.query(Book.isbn).filter(Book.isbn != None).order_by(func.rand()).first()
    session.close()
    if not row or not row[0]:
        return jsonify({"error": "Aucun ISBN trouvé"}), 404
    isbn = row[0]
    covers_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "covers"))
    cover_path = os.path.join(covers_dir, f"{isbn}.jpg")
    if not os.path.exists(cover_path):
        return jsonify({"error": "Aucune couverture trouvée pour cet ISBN"}), 404
    url = f"/cover/{isbn}.jpg"
    return jsonify({"isbn": isbn, "url": url})
