"""
Database Models and Utilities

This module defines all SQLAlchemy models for the book scanning application:
- Book: Core book metadata and information
- PendingBook: Queue for books awaiting processing
- User: User accounts and management
- Collection: User-created book collections  
- ScanLog: Tracking of all scan operations
- AppLog: Application event logging
- DailyStats: Aggregated daily analytics

Also provides utilities for logging and statistics calculation.
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, Float, JSON, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection configuration
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS") 
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Book(Base):
    """
    Core book metadata and information.
    
    Stores complete book details fetched from external APIs like Google Books.
    The isbn field (ISBN-10) is the primary key used for cover files and indexing.
    """
    __tablename__ = "books"

    isbn = Column(String(20), primary_key=True, index=True)  # ISBN-10, used for covers
    title = Column(String(512), nullable=False)
    authors = Column(JSON)  # List of author names
    isbn13 = Column(String(20))  # 13-digit ISBN for API lookups
    pages = Column(Integer)
    publication_date = Column(String(20))  # Flexible format from APIs
    publisher = Column(String(128))
    language_code = Column(String(10))  # ISO language code
    cover_url = Column(String(512))  # Original cover URL from API
    external_links = Column(JSON)  # List of related URLs
    description = Column(Text)  # Book summary/description
    genres = Column(JSON)  # List of genre/category strings
    average_rating = Column(Float)  # Average user rating
    ratings_count = Column(Integer)  # Number of ratings
    date_added = Column(DateTime, default=datetime.utcnow, nullable=True)  # When added to our DB


class PendingBook(Base):
    """
    Queue for books awaiting processing by worker.
    
    When a barcode is scanned, the ISBN is added here for background processing.
    Books marked as 'stucked' failed processing and need manual review.
    """
    __tablename__ = "pending_books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    isbn = Column(String(20), unique=True, nullable=False)  # ISBN to process
    stucked = Column(Boolean, default=False)  # True if processing failed


class ScanLog(Base):
    """
    Tracking log for all scan operations (barcode and image matching).
    
    Used for analytics, debugging, and user activity tracking.
    Status values: 'success', 'error', 'not_found', 'pending'
    """
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    isbn = Column(String(20), nullable=True)  # May be null for failed scans
    status = Column(String(32), nullable=False)  # Processing result
    message = Column(Text, nullable=True)  # Human-readable description
    extra = Column(JSON, nullable=True)  # Additional context (scan type, user, etc.)


class AppLog(Base):
    """
    Application event logging for debugging and monitoring.
    
    Captures system events, errors, and important operations.
    Levels: 'INFO', 'WARNING', 'ERROR', 'SUCCESS'
    """
    __tablename__ = "app_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    level = Column(String(16), nullable=False)  # Log severity level
    message = Column(Text, nullable=False)  # Event description
    context = Column(JSON, nullable=True)  # Additional structured data


class User(Base):
    """
    User accounts for the application.
    
    Simple user model with just username. Users are created automatically
    when they first scan a book or create a collection.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False)


class Collection(Base):
    """
    User-created book collections.
    
    Users can organize their scanned books into named collections with icons.
    Each collection belongs to a specific user (owner).
    """
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)  # Collection display name
    owner = Column(Integer, ForeignKey("users.id"), nullable=False)  # Owning user ID
    icon = Column(String(255))  # Icon identifier for UI


class CollectionBook(Base):
    """
    Many-to-many relationship between collections and books.
    
    Tracks which books are in which collections.
    Uses composite primary key of collection_id and isbn.
    """
    __tablename__ = "collection_books"

    collection_id = Column(Integer, ForeignKey("collections.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)


class UserScan(Base):
    """
    Tracking table for user scan history.
    
    Records when users scan books for recent activity and analytics.
    Uses composite primary key to allow multiple scans of same book by same user.
    """
    __tablename__ = "user_scans"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)
    timestamp = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)


class UserAddedBook(Base):
    """
    Tracking table for books added by users.
    
    Records when users add new books to the system (via barcode scanning).
    """
    __tablename__ = "user_added_books"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    isbn = Column(String(20), ForeignKey("books.isbn"), primary_key=True)
    timestamp = Column(DateTime, primary_key=True, default=datetime.utcnow, nullable=False)


class DailyStats(Base):
    """
    Aggregated daily statistics for analytics dashboard.
    
    Pre-calculated metrics updated daily to avoid expensive real-time queries.
    Includes cumulative totals and daily activity counts.
    """
    __tablename__ = "daily_stats"

    date = Column(Date, primary_key=True)
    
    # Cumulative totals (all time)
    total_books = Column(Integer, default=0)
    total_users = Column(Integer, default=0)
    total_collections = Column(Integer, default=0)
    
    # Daily activity counts
    books_added_today = Column(Integer, default=0)  # New books added to database
    users_added_today = Column(Integer, default=0)  # New user registrations
    collections_added_today = Column(Integer, default=0)  # New collections created
    
    # Scan activity breakdown
    barcode_scans_today = Column(Integer, default=0)  # Barcode scan attempts
    image_scans_today = Column(Integer, default=0)  # Image matching attempts
    successful_scans_today = Column(Integer, default=0)  # Scans that found matches
    failed_scans_today = Column(Integer, default=0)  # Scans with errors/no matches
    pending_books_today = Column(Integer, default=0)  # Books added to processing queue
    
    # System health
    worker_errors_today = Column(Integer, default=0)  # Worker processing errors
    active_users_today = Column(Integer, default=0)  # Users who performed scans


def log_app(level: str, message: str, context: dict = None) -> None:
    """
    Utility function to log application events.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
        message: Human-readable log message
        context: Optional additional context data
    """
    session = SessionLocal()
    app_log = AppLog(level=level, message=message, context=context)
    session.add(app_log)
    session.commit()
    session.close()


def calculate_daily_stats(target_date: date = None) -> DailyStats:
    """
    Calculate and store daily statistics for a given date.
    
    This function computes comprehensive daily metrics including:
    - Total counts (books, users, collections)
    - Daily activity (scans, additions, errors)
    - Scan success/failure rates
    - Active user counts
    
    Args:
        target_date: Date to calculate stats for (defaults to today)
        
    Returns:
        DailyStats object with calculated metrics, or None if calculation failed
        
    Note:
        Statistics explanation:
        - Successful scans: Scans that found a book (status="success")
        - Failed scans: Scans that failed to find a match (status="error" or "not_found") 
        - Pending: Books added to processing queue (status="pending")
    """
    if target_date is None:
        target_date = date.today()
    
    session = SessionLocal()
    daily_stat = None
    
    try:
        from sqlalchemy import func, and_
        
        # Calculate cumulative totals
        total_books = session.query(Book).count()
        total_users = session.query(User).count()
        total_collections = session.query(Collection).count()
        
        # Create datetime range for the target date
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
        
        # Base query for all scans today
        all_scans_today = session.query(ScanLog).filter(
            and_(
                ScanLog.timestamp >= start_datetime,
                ScanLog.timestamp < end_datetime
            )
        )
        
        # Count scans by status
        successful_scans_today = all_scans_today.filter(ScanLog.status == "success").count()
        failed_scans_today = all_scans_today.filter(ScanLog.status.in_(["error", "not_found"])).count()
        pending_books_today = all_scans_today.filter(ScanLog.status == "pending").count()
        
        # Count scans by type (check extra field for scan method)
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
        
        # Fallback: if scan types can't be detected, assume all are barcode
        total_scans_count = all_scans_today.count()
        if barcode_scans_today + image_scans_today == 0 and total_scans_count > 0:
            barcode_scans_today = total_scans_count
        
        # Count books actually added to database today (using date_added column)
        books_added_today = session.query(Book).filter(
            and_(
                Book.date_added >= start_datetime,
                Book.date_added < end_datetime
            )
        ).count()
        
        # Count collections created today (from app logs)
        collections_added_today = session.query(AppLog).filter(
            and_(
                AppLog.timestamp >= start_datetime,
                AppLog.timestamp < end_datetime,
                AppLog.level == "SUCCESS",
                AppLog.message.like("%Collection created:%")
            )
        ).count()
        
        # Count worker errors
        worker_errors_today = session.query(AppLog).filter(
            and_(
                AppLog.timestamp >= start_datetime,
                AppLog.timestamp < end_datetime,
                AppLog.level == "ERROR",
                AppLog.message.like("%worker%")
            )
        ).count()

        # Count unique active users (users who made scans today)
        active_users_today = session.query(UserScan.user_id).filter(
            and_(
                UserScan.timestamp >= start_datetime,
                UserScan.timestamp < end_datetime
            )
        ).distinct().count()
        
        # Create or update daily stats record
        daily_stat = session.query(DailyStats).filter_by(date=target_date).first()
        if not daily_stat:
            daily_stat = DailyStats(date=target_date)
            session.add(daily_stat)
        
        # Update all calculated values
        daily_stat.total_books = total_books
        daily_stat.total_users = total_users
        daily_stat.total_collections = total_collections
        daily_stat.books_added_today = books_added_today
        daily_stat.users_added_today = 0  # Would need created_at field on users
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
        
        # Log summary of calculated stats
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
        # Keep session open since we're returning the object
        pass


def initialize_historical_stats(days_back: int = 7) -> None:
    """
    Initialize daily stats for the past N days.
    
    Useful for populating historical data when first setting up analytics.
    
    Args:
        days_back: Number of days to calculate backwards from today
    """
    today = date.today()
    for i in range(days_back):
        target_date = today - timedelta(days=i)
        print(f"Calculating stats for {target_date}...")
        daily_stat = calculate_daily_stats(target_date)
        
        # Properly save the stats with a new session
        if daily_stat:
            session = SessionLocal()
            try:
                session.merge(daily_stat)
                session.commit()
            finally:
                session.close()
                
    print(f"✅ Initialized {days_back} days of historical stats")


def init_db() -> None:
    """Initialize database by creating all tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("✅ Database initialized successfully.")
    
    # Initialize some historical stats for analytics
    print("📊 Initializing historical statistics...")
    initialize_historical_stats(7)