import pandas as pd
import json
from tqdm import tqdm

# Function to process DS1.csv
def process_ds1(df):
    # Prepare the formatted data
    df['title'] = df['name']
    df['authors'] = df['author'].apply(lambda x: [x])
    df['cover'] = df['img_paths']
    df['categories'] = df['category'].apply(lambda x: [x])
    df['ISBN'] = df['isbn']
    df['rating'] = df['book_depository_stars']

    # Add missing columns with default empty strings
    missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink']
    for col in missing_columns:
        df[col] = ''

    # Define columns for the new DataFrame
    new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

    # Create a new DataFrame with the required structure
    processed_df = df[new_columns].copy()

    return processed_df

# Function to process DS2.csv
def process_ds2(df):
    # Prepare the formatted data
    df['title'] = df['title']
    df['authors'] = df['brand'].apply(lambda x: [x] if pd.notna(x) else [])
    df['cover'] = df['image_url']

    # Process and extract categories, excluding 'Books'
    def extract_categories(categories_str):
        try:
            categories_list = json.loads(categories_str.replace("'", '"'))
            return [cat for cat in categories_list if cat != "Books"]
        except json.JSONDecodeError:
            return []

    df['categories'] = df['categories'].apply(extract_categories)
    df['ISBN'] = df['ISBN10']
    df['rating'] = df['rating'].str.extract(r'(\d+\.\d+|\d+) out of 5 stars').astype(float)

    # Add missing columns with default empty strings
    missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink']
    for col in missing_columns:
        df[col] = ''

    # Define columns for the new DataFrame
    new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

    # Create a new DataFrame with the required structure
    processed_df = df[new_columns].copy()

    return processed_df

# Function to process DS3.csv
def process_ds3(df):
    # Prepare the formatted data
    df['title'] = df['title']
    df['authors'] = df['authors'].apply(lambda x: x.split(", "))
    df['cover'] = df['image_url']
    df['ISBN'] = df['isbn']
    df['rating'] = df['average_rating']

    # Add missing columns with default empty strings
    missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'genres']
    for col in missing_columns:
        df[col] = ''

    # Update 'language' and 'publicationYear' from existing columns
    df['language'] = df['language_code']
    df['publicationYear'] = df['original_publication_year'].fillna('').apply(lambda x: str(int(float(x))) if x else '')

    # Define columns for the new DataFrame
    new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'genres', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

    # Create a new DataFrame with the required structure
    processed_df = df[new_columns].copy()

    return processed_df

# Function to process DS4.csv
def process_ds4(df):
    # Function to combine main and additional authors
    def combine_authors(row):
        authors = []
        if pd.notna(row['Auteur_principal_nom_700a']) and pd.notna(row['Auteur_principal_prenom_700b']):
            authors.append(f"{row['Auteur_principal_prenom_700b']} {row['Auteur_principal_nom_700a']}")
        if pd.notna(row['Autre_auteur_principal_nom_701a']) and pd.notna(row['Autre_auteur_principal_prenom_702b']):
            authors.append(f"{row['Autre_auteur_principal_prenom_702b']} {row['Autre_auteur_principal_nom_701a']}")
        return authors

    # Prepare the formatted data
    df['title'] = df['Titre_200a']
    df['authors'] = df.apply(combine_authors, axis=1)
    df['cover'] = df['Illustration_ill']
    df['summary'] = df['Resume_abs']
    df['language'] = df['Langue_101a']
    df['editor'] = df['Editeur_210c']
    df['publicationYear'] = df['Annee_202a'].fillna('').apply(lambda x: str(int(x)) if pd.notna(x) else '')
    df['pagesNumber'] = df['Nombre_de_pages_300a'].fillna('').apply(lambda x: str(int(x)) if pd.notna(x) else '')
    df['ISBN'] = df['ISBN_010a']
    df['amazonLink'] = ''  # Fill this with appropriate values if available
    df['kindleLink'] = ''  # Fill this with appropriate values if available
    df['audibleLink'] = ''  # Fill this with appropriate values if available
    df['fnacLink'] = ''  # Fill this with appropriate values if available
    df['rating'] = ''  # Fill this with appropriate values if available
    df['categories'] = ''  # Fill this with appropriate values if available

    # Define columns for the new DataFrame
    new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

    # Create a new DataFrame with the required structure
    processed_df = df[new_columns].copy()

    # Save the DataFrame to a CSV file
    processed_df.to_csv('processed_DS4.csv', index=False)

# Function to process DS5.csv
def process_ds5(df):
    # Prepare the formatted data
    df['title'] = df['Title']
    df['authors'] = df['Author'].apply(lambda x: [x] if pd.notna(x) else [])
    df['cover'] = df['Image']
    df['summary'] = df['Description']
    df['language'] = df['Language']
    df['genres'] = df['Genre'].str.split(';').fillna([])
    df['editor'] = df['Publisher']
    df['publicationYear'] = df['Publication Date'].apply(lambda x: str(x) if pd.notna(x) else '')
    df['pagesNumber'] = df['Pages'].apply(lambda x: str(x) if pd.notna(x) else '')
    df['ISBN'] = df['ISBN-10']
    df['amazonLink'] = ''  # Fill this with appropriate values if available
    df['kindleLink'] = ''  # Fill this with appropriate values if available
    df['audibleLink'] = ''  # Fill this with appropriate values if available
    df['fnacLink'] = ''  # Fill this with appropriate values if available
    df['rating'] = ''  # Fill this with appropriate values if available

    # Define columns for the new DataFrame
    new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'genres', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

    # Create a new DataFrame with the required structure
    processed_df = df[new_columns].copy()

    # Save the DataFrame to a CSV file
    processed_df.to_csv('processed_DS5.csv', index=False)


# Function to process and save a DataFrame to CSV with specified encoding
def process_and_save_df(input_csv, output_csv, process_function, encoding='utf-8', delimiter=','):
    df = pd.read_csv(input_csv, dtype=str, encoding=encoding , delimiter=delimiter)
    processed_df = process_function(df)
    processed_df.to_csv(output_csv, index=False, encoding=encoding)

# List of input and output files
input_files = ['DS1.csv', 'DS2.csv', 'DS3.csv', 'DS4.csv', 'DS5.csv']
output_files = ['processed_DS1.csv', 'processed_DS2.csv', 'processed_DS3.csv', 'processed_DS4.csv', 'processed_DS5.csv']

for i in tqdm(range(len(input_files)), desc="Processing Files"):
    input_file = input_files[i]
    output_file = output_files[i]
    
    # Print the current file being processed
    print(f"Processing {input_file}...")
    
    if i == 0:
        process_and_save_df(input_file, output_file, process_ds1)
    elif i == 1:
        process_and_save_df(input_file, output_file, process_ds2)
    elif i == 2:
        process_and_save_df(input_file, output_file, process_ds3)
    elif i == 3:
        process_and_save_df(input_file, output_file, process_ds4, encoding='latin-1', delimiter=';')  # Specify encoding here
    elif i == 4:
        process_and_save_df(input_file, output_file, process_ds5, delimiter=';')

    # Print a message indicating that the file has been processed
    print(f"{input_file} processed and saved as {output_file}")
