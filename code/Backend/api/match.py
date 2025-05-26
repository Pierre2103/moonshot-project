# === match.py ===
from flask import Blueprint, request, jsonify, send_from_directory
from PIL import UnidentifiedImageError
from io import BytesIO
import numpy as np
import torch
import os
import faiss
import json
from sqlalchemy.orm import Session
from utils.db_models import SessionLocal, Book, ScanLog, AppLog

# Utilise toujours les chemins absolus
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COVERS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "covers"))
INDEX_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "index.faiss"))
NAMES_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "image_names.json"))
print(f"match.py: COVERS_DIR={COVERS_DIR}")

def log_app(level, message, context=None):
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()

def log_scan(isbn, status, message, extra=None):
    session = SessionLocal()
    scan_log = ScanLog(isbn=isbn, status=status, message=message, extra=extra)
    session.add(scan_log)
    session.commit()
    session.close()

def create_match_api(model, processor, device, index_path=INDEX_PATH, names_path=NAMES_PATH, metadata=None):
    match_api = Blueprint("match_api", __name__)

    @match_api.route("/match", methods=["POST"])
    def match_cover():
        log_app("INFO", "Requête reçue sur /match")

        if "image" not in request.files:
            log_app("ERROR", "Aucun fichier image trouvé dans la requête")
            log_scan(
                isbn=None,
                status="error",
                message="Aucun fichier image trouvé dans la requête",
                extra={"request_info": "image match"}
            )
            return jsonify({"error": "No image uploaded"}), 400

        image_file = request.files["image"]
        log_app("INFO", f"Image reçue : {image_file.filename} ({image_file.content_type})")

        try:
            image_bytes = image_file.read()
            log_app("INFO", f"Taille de l'image reçue : {len(image_bytes)} bytes")

            from PIL import Image
            image = Image.open(BytesIO(image_bytes)).convert("RGB").resize((224, 224))
            inputs = processor(text=[""], images=image, return_tensors="pt").to(device)

            with torch.no_grad():
                outputs = model(**inputs)
                embedding = outputs.image_embeds[0].cpu().numpy()

            # Rechargement index et noms à chaque scan
            log_app("INFO", "Rechargement de l'index FAISS et des noms d'images")
            index = faiss.read_index(str(index_path))
            with open(str(names_path), "r") as f:
                image_names = json.load(f)

            D, I = index.search(np.array([embedding]), k=4)
            indices = I[0]
            distances = D[0]

            session: Session = SessionLocal()
            suggestions = []

            for idx, score in zip(indices, distances):
                filename = image_names[idx]
                isbn = os.path.splitext(filename)[0]
                book = session.query(Book).filter_by(isbn=isbn).first()
                if book:
                    suggestions.append({
                        "filename": filename,
                        "score": float(score),
                        "title": book.title,
                        "authors": book.authors,
                        "cover_url": f"/cover/{filename}"
                    })

            session.close()

            if not suggestions:
                log_app("WARNING", "Aucun livre trouvé pour ce scan de couverture")
                log_scan(
                    isbn=None,
                    status="not_found",
                    message="Aucun livre trouvé",
                    extra={"request_info": "image match"}
                )
                return jsonify({"error": "No valid book matches found"}), 404

            top_match = suggestions[0]      # Best match
            alternatives = suggestions[1:]

            log_app("SUCCESS", f"Match trouvé : {top_match['title']} (score={top_match['score']})")

            log_scan(
                isbn=top_match["filename"].split('.')[0],
                status="success",
                message="Scan couverture",
                extra={"request_info": "image match", "details": {"top_match": top_match, "alternatives": alternatives}}
            )

            return jsonify({
                "filename": top_match["filename"],
                "score": top_match["score"],
                "title": top_match["title"],
                "authors": top_match["authors"],
                "cover_url": top_match["cover_url"],
                "alternatives": alternatives
            })

        except UnidentifiedImageError:
            log_app("ERROR", "Fichier illisible (format image invalide)")
            log_scan(
                isbn=None,
                status="error",
                message="Fichier illisible (format image invalide)",
                extra={"request_info": "image match"}
            )
            return jsonify({"error": "Unreadable image format"}), 400

        except Exception as e:
            log_app("ERROR", f"Erreur serveur : {str(e)}")
            log_scan(
                isbn=None,
                status="error",
                message=f"Erreur serveur : {str(e)}",
                extra={"request_info": "image match"}
            )
            return jsonify({"error": f"Internal error: {str(e)}"}), 500

    @match_api.route("/cover/<filename>", methods=["GET"])
    def serve_cover(filename):
        # Pas besoin de log ici, c'est juste un GET statique
        return send_from_directory(COVERS_DIR, filename)

    return match_api
