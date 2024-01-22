import pandas as pd

# Load the CSV file
df = pd.read_csv('DS3.csv')

# Extract unique languages
unique_languages = df['language_code'].unique()

# # Print the results
# print("Unique Languages:")
# print(unique_languages)
# # Unique Languages: ['eng' 'en-US' 'en-CA' nan 'spa' 'en-GB' 'fre' 'nl' 'ara' 'por' 'ger' 'nor' 'jpn' 'en' 'vie' 'ind' 'pol' 'tur' 'dan' 'fil' 'ita' 'per' 'swe' 'rum' 'mul' 'rus']

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
df['publicationYear'] = df['original_publication_year'].fillna('').apply(lambda x: str(int(x)) if x else '')

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'genres', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('processed_DS3.csv', index=False)
