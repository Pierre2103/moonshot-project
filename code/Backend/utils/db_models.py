from sqlalchemy import create_engine, Column, Integer, String, Text, Float, JSON, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# === CONFIG ===
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")


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
    date_added = Column(DateTime, default=datetime.utcnow, nullable=True)  # New column

# === TABLE pending_books ===
class PendingBook(Base):
    __tablename__ = "pending_books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    isbn = Column(String(20), unique=True, nullable=False)
    stucked = Column(Boolean, default=False)

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

# === TABLE daily_stats ===
class DailyStats(Base):
    __tablename__ = "daily_stats"

    date = Column(Date, primary_key=True)
    total_books = Column(Integer, default=0)
    total_users = Column(Integer, default=0)
    total_collections = Column(Integer, default=0)
    books_added_today = Column(Integer, default=0)
    users_added_today = Column(Integer, default=0)
    collections_added_today = Column(Integer, default=0)
    barcode_scans_today = Column(Integer, default=0)
    image_scans_today = Column(Integer, default=0)
    successful_scans_today = Column(Integer, default=0)
    failed_scans_today = Column(Integer, default=0)
    pending_books_today = Column(Integer, default=0)
    worker_errors_today = Column(Integer, default=0)
    active_users_today = Column(Integer, default=0)  # users who scanned something today

# === Fonction utilitaire de log ===
def log_app(level, message, context=None):
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()

# === Fonction utilitaire pour calculer les stats quotidiennes ===
def calculate_daily_stats(target_date=None):
    """Calculate and store daily statistics for a given date (default: today)
    
    Statistics explanation:
    - Successful scans: Scans that found a book (status="success")
    - Failed scans: Scans that failed to find a match or had errors (status="error" or "not_found") 
    - Pending: Books added to processing queue (status="pending")
    - Success rate: Percentage of successful scans vs total scans
    """
    if target_date is None:
        target_date = date.today()
    
    session = SessionLocal()
    daily_stat = None
    
    try:
        from sqlalchemy import func, and_
        
        # Total counts (cumulative)
        total_books = session.query(Book).count()
        total_users = session.query(User).count()
        total_collections = session.query(Collection).count()
        
        # Create datetime range for the target date
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
        
        # All scans today (both barcode and image scans)
        all_scans_today = session.query(ScanLog).filter(
            and_(
                ScanLog.timestamp >= start_datetime,
                ScanLog.timestamp < end_datetime
            )
        )
        
        # SUCCESSFUL SCANS: Scans that successfully found/matched a book
        successful_scans_today = all_scans_today.filter(
            ScanLog.status == "success"
        ).count()
        
        # FAILED SCANS: Scans that failed to find a match or had errors
        failed_scans_today = all_scans_today.filter(
            ScanLog.status.in_(["error", "not_found"])
        ).count()
        
        # PENDING: Books added to processing queue (barcode scans that need worker processing)
        pending_books_today = all_scans_today.filter(
            ScanLog.status == "pending"
        ).count()
        
        # Count barcode vs image scans by checking the extra field
        barcode_scans_today = session.query(ScanLog).filter(
            and_(
                ScanLog.timestamp >= start_datetime,
                ScanLog.timestamp < end_datetime,
                ScanLog.extra.like('%barcode%')
            )
        ).count()
        
        image_scans_today = session.query(ScanLog).filter(
            and_(
                ScanLog.timestamp >= start_datetime,
                ScanLog.timestamp < end_datetime,
                ScanLog.extra.like('%image match%')
            )
        ).count()
        
        # If we can't detect types, count all scans as barcode (since that's more common)
        total_scans_count = all_scans_today.count()
        if barcode_scans_today + image_scans_today == 0 and total_scans_count > 0:
            barcode_scans_today = total_scans_count
        
        # BOOKS ADDED: Count books that were actually added to the database today
        # Use the new date_added column for accurate counting
        books_added_today = session.query(Book).filter(
            and_(
                Book.date_added >= start_datetime,
                Book.date_added < end_datetime
            )
        ).count()
        
        # Users and collections added today
        users_added_today = 0  # Would need created_at field on users table
        
        # Collections added today - count from app logs
        collections_added_today = session.query(AppLog).filter(
            and_(
                AppLog.timestamp >= start_datetime,
                AppLog.timestamp < end_datetime,
                AppLog.level == "SUCCESS",
                AppLog.message.like("%Collection created:%")
            )
        ).count()
        
        worker_errors_today = session.query(AppLog).filter(
            and_(
                AppLog.timestamp >= start_datetime,
                AppLog.timestamp < end_datetime,
                AppLog.level == "ERROR",
                AppLog.message.like("%worker%")
            )
        ).count()

        # Active users today (users who made scans)
        active_users_today = session.query(UserScan.user_id).filter(
            and_(
                UserScan.timestamp >= start_datetime,
                UserScan.timestamp < end_datetime
            )
        ).distinct().count()
        
        # Create or update daily stats
        daily_stat = session.query(DailyStats).filter_by(date=target_date).first()
        if not daily_stat:
            daily_stat = DailyStats(date=target_date)
            session.add(daily_stat)
        
        daily_stat.total_books = total_books
        daily_stat.total_users = total_users
        daily_stat.total_collections = total_collections
        daily_stat.books_added_today = books_added_today
        daily_stat.users_added_today = users_added_today
        daily_stat.collections_added_today = collections_added_today
        daily_stat.barcode_scans_today = barcode_scans_today
        daily_stat.image_scans_today = image_scans_today
        daily_stat.successful_scans_today = successful_scans_today
        daily_stat.failed_scans_today = failed_scans_today
        daily_stat.pending_books_today = pending_books_today
        daily_stat.worker_errors_today = worker_errors_today
        daily_stat.active_users_today = active_users_today
        
        session.commit()
        session.refresh(daily_stat)
        
        print(f"✅ Daily stats calculated for {target_date}:")
        print(f"   📊 Total scans: {total_scans_count} (Barcode: {barcode_scans_today}, Image: {image_scans_today})")
        print(f"   ✅ Successful: {successful_scans_today}")
        print(f"   ❌ Failed: {failed_scans_today}") 
        print(f"   ⏳ Pending: {pending_books_today}")
        print(f"   📚 Books added: {books_added_today}")
        
        return daily_stat
        
    except Exception as e:
        session.rollback()
        print(f"Error calculating daily stats: {e}")
        return None
    finally:
        # Don't close session here since we're returning the object
        pass

def initialize_historical_stats(days_back=7):
    """Initialize daily stats for the past N days"""
    today = date.today()
    for i in range(days_back):
        target_date = today - timedelta(days=i)
        print(f"Calculating stats for {target_date}...")
        daily_stat = calculate_daily_stats(target_date)
        # Close the session properly after each calculation
        if daily_stat:
            session = SessionLocal()
            try:
                session.merge(daily_stat)
                session.commit()
            finally:
                session.close()
    print(f"✅ Initialized {days_back} days of historical stats")

# === Création des tables ===
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("✅ Database initialized successfully.")
    
    # Initialize some historical stats
    print("📊 Initializing historical statistics...")
    initialize_historical_stats(7)