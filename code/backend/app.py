from flask import Flask, request, jsonify
from flask_cors import CORS
import csv

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def search_book_by_isbn(isbn, file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            
            for row in csv_reader:
                if isbn == row['ISBN']:
                    return row
            return None
    except FileNotFoundError:
        return {"error": f"The file {file_path} was not found."}
    except Exception as e:
        return {"error": str(e)}

@app.route('/search', methods=['GET'])
def search():
    isbn = request.args.get('isbn')
    if not isbn:
        return jsonify({"error": "ISBN not provided"}), 400
    
    csv_file_path = 'FINAL_DATASET.csv'
    result = search_book_by_isbn(isbn, csv_file_path)
    
    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Book not found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5008, debug=True)

