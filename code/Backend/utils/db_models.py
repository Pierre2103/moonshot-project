from sqlalchemy import create_engine, Column, Integer, String, Text, Float, JSON, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# === CONFIG ===
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "rootroot")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "bookmatcher")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# === TABLE books ===
class Book(Base):
    __tablename__ = "books"

    isbn = Column(String(20), primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(JSON)  # liste de strings
    isbn13 = Column(String(20))
    pages = Column(Integer)
    publication_date = Column(String(20))
    publisher = Column(String(128))
    language_code = Column(String(10))
    cover_url = Column(String(512))
    external_links = Column(JSON)  # dictionnaire {goodreads, amazon, bookshop}
    description = Column(Text)
    genres = Column(JSON)  # liste de strings
    average_rating = Column(Float)
    ratings_count = Column(Integer)

# === TABLE pending_books ===
class PendingBook(Base):
    __tablename__ = "pending_books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    isbn = Column(String(20), unique=True, nullable=False)
    auto_process = Column(Boolean, default=False)

# === TABLE scan_logs ===
class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    isbn = Column(String(20), nullable=True)
    status = Column(String(32), nullable=False)  # ex: "success", "error"
    message = Column(Text, nullable=True)
    extra = Column(JSON, nullable=True)  # pour stocker des infos additionnelles

# === TABLE app_logs ===
class AppLog(Base):
    __tablename__ = "app_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    level = Column(String(16), nullable=False)  # ex: "INFO", "WARNING", "ERROR"
    message = Column(Text, nullable=False)
    context = Column(JSON, nullable=True)  # infos additionnelles (user, endpoint, etc.)

# === TABLE users ===
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False)

# === TABLE collections ===
class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    owner = Column(Integer, ForeignKey("users.id"), nullable=False)
    icon = Column(String(255))

# === TABLE collection_books ===
class CollectionBook(Base):
    __tablename__ = "collection_books"

    collection_id = Column(Integer, ForeignKey("collections.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)

# === TABLE user_scans ===
class UserScan(Base):
    __tablename__ = "user_scans"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)
    timestamp = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)

# === TABLE user_added_books ===
class UserAddedBook(Base):
    __tablename__ = "user_added_books"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)
    timestamp = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)

# === Fonction utilitaire de log ===
def log_app(level, message, context=None):
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()

# === Création des tables ===
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("✅ Base de données initialisée avec succès.")