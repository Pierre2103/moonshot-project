import os
import glob
from datetime import datetime
from utils.db_models import SessionLocal, Book
from sqlalchemy import text
from tqdm import tqdm

def get_file_creation_date(file_path):
    """Get the creation date of a file"""
    try:
        # Get file stats
        stat = os.stat(file_path)
        # Use the earliest of creation time or modification time
        creation_time = min(stat.st_ctime, stat.st_mtime)
        return datetime.fromtimestamp(creation_time)
    except Exception as e:
        print(f"Error getting date for {file_path}: {e}")
        return datetime.now()

def update_books_with_dates():
    """Update all books with date_added from their cover file creation dates"""
    
    # First, add the column if it doesn't exist
    session = SessionLocal()
    try:
        # Check if column exists and add it if not
        result = session.execute(text("SHOW COLUMNS FROM books LIKE 'date_added'"))
        if not result.fetchone():
            print("Adding date_added column to books table...")
            session.execute(text("ALTER TABLE books ADD COLUMN date_added DATETIME"))
            session.commit()
            print("✅ date_added column added successfully")
        else:
            print("date_added column already exists")
    except Exception as e:
        print(f"Error adding column: {e}")
        session.rollback()
    finally:
        session.close()
    
    # Get covers directory
    covers_dir = os.path.join(os.path.dirname(__file__), "data", "covers")
    if not os.path.exists(covers_dir):
        print(f"❌ Covers directory not found: {covers_dir}")
        return
    
    print(f"📁 Scanning covers directory: {covers_dir}")
    
    # Get all cover files
    cover_files = glob.glob(os.path.join(covers_dir, "*.jpg"))
    print(f"📄 Found {len(cover_files)} cover files")
    
    if not cover_files:
        print("No cover files found to process")
        return
    
    session = SessionLocal()
    updated_count = 0
    not_found_count = 0
    
    try:
        # Add progress bar with tqdm
        print("\n🔄 Processing cover files...")
        with tqdm(total=len(cover_files), desc="Updating books", unit="files") as pbar:
            for cover_file in cover_files:
                # Extract ISBN from filename
                filename = os.path.basename(cover_file)
                isbn = os.path.splitext(filename)[0]
                
                # Find the book in database
                book = session.query(Book).filter_by(isbn=isbn).first()
                if book:
                    # Get file creation date
                    file_date = get_file_creation_date(cover_file)
                    
                    # Update book with date_added
                    book.date_added = file_date
                    updated_count += 1
                    
                    # Update progress bar description with current book
                    pbar.set_postfix_str(f"Updated: {book.title[:30]}...")
                else:
                    not_found_count += 1
                    pbar.set_postfix_str(f"Book not found: {isbn}")
                
                # Update progress bar
                pbar.update(1)
        
        # Commit all changes
        print("\n💾 Committing changes to database...")
        session.commit()
        print(f"\n✅ Successfully updated {updated_count} books with date_added")
        
        if not_found_count > 0:
            print(f"⚠️  {not_found_count} cover files had no matching book in database")
        
        # Show some statistics
        total_books = session.query(Book).count()
        books_with_dates = session.query(Book).filter(Book.date_added.isnot(None)).count()
        print(f"\n📊 Statistics:")
        print(f"   Total books in database: {total_books}")
        print(f"   Books with dates: {books_with_dates}")
        print(f"   Books without dates: {total_books - books_with_dates}")
        print(f"   Cover files processed: {len(cover_files)}")
        print(f"   Books updated: {updated_count}")
        print(f"   Cover files without matching books: {not_found_count}")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error updating books: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("🚀 Starting date_added population script...")
    print("📦 Installing required package...")
    
    # Try to import tqdm, install if not available
    try:
        from tqdm import tqdm
    except ImportError:
        print("Installing tqdm for progress bar...")
        import subprocess
        import sys
        subprocess.check_call([sys.executable, "-m", "pip", "install", "tqdm"])
        from tqdm import tqdm
        print("✅ tqdm installed successfully")
    
    update_books_with_dates()
    print("🏁 Script completed!")
