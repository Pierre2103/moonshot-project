import pandas as pd

# Load the CSV file
file_path = 'DS5.csv'
df = pd.read_csv(file_path, delimiter=';', encoding='ISO-8859-1', dtype=str)

# Prepare the formatted data
df['title'] = df['Book-Title']
df['authors'] = df['Book-Author'].apply(lambda x: [x])
df['cover'] = df['Image-URL-L']
df['ISBN'] = df['ISBN']

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'genres', 'rating']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'genres', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('processed_DS5.csv', index=False)
