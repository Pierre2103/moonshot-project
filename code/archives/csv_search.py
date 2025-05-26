import csv
import sys
import requests
from PIL import Image
from io import BytesIO

def search_book_by_isbn(isbn, file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            
            print(f"Searching for ISBN: {isbn}")
            
            for row in csv_reader:
                if isbn == row['ISBN']:
                    print("Found the book!")
                    print(row)
                    return
            print("Book not found!")
    except FileNotFoundError:
        print(f"The file {file_path} was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

# ISBN input to search
ISBN = sys.argv[1]
# Path to the CSV file
csv_file_path = 'FINAL_DATASET.csv'

# Call the search function
search_book_by_isbn(ISBN, csv_file_path)


