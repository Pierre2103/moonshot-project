import pandas as pd

# Load the CSV file for DS3
df = pd.read_csv('../not_processed_data/DS3.csv')

# Check if 'original_publication_year' is in the columns
if 'original_publication_year' in df.columns:
    print("The column 'original_publication_year' is in the DataFrame.")
    # Fill missing values in 'original_publication_year' and convert to string
    df['publicationYear'] = df['original_publication_year'].fillna('').astype(str)
else:
    print("The column 'original_publication_year' is not in the DataFrame.")
    print("Checking for variations of the column name...")
    # Check for variations of the column name
    possible_columns = [col for col in df.columns if 'publication_year' in col.lower()]
    print("Possible column variations:", possible_columns)

# Extract unique languages
unique_languages = df['language_code'].unique()

# Drop unnecessary columns
columns_to_drop = ['book_id', 'goodreads_book_id', 'best_book_id', 'work_id',
                   'books_count', 'isbn13', 'original_title',
                   'ratings_count', 'work_ratings_count', 'work_text_reviews_count',
                   'ratings_1', 'ratings_2', 'ratings_3', 'ratings_4', 'ratings_5',
                   'small_image_url', 'original_publication_year']

# Write initial details to Markdown file
with open('../markdown/ds3_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS3 - Before clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['isbn'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['title'].unique())))
    file.write("\n## Total Unique Languages: " + str(len(unique_languages)))
    file.write("\n<details><summary>Unique Languages</summary>\n\n")
    for lang in unique_languages:
        file.write("\n- " + str(lang))
    file.write("\n\n</details>\n")

# Remove duplicates based on ISBN and title
df.drop_duplicates(subset=['isbn'], inplace=True)
df.drop_duplicates(subset=['title'], inplace=True)

# Add missing columns with default empty strings
missing_columns = ['summary', 'categories', 'editor', 'pagesNumber', 'amazonLink',
                   'kindleLink', 'audibleLink', 'fnacLink']
for col in missing_columns:
    df[col] = ''

# Update column names
df.rename(columns={'isbn': 'ISBN', 'language_code': 'language', 'average_rating': 'rating',
                   'image_url': 'cover'}, inplace=True)

# Define columns for the new DataFrame
new_columns = ['title', 'cover', 'summary', 'language', 'categories',
               'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink',
               'audibleLink', 'fnacLink', 'ISBN', 'rating', 'authors']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS3.csv', index=False)

# Replace language codes with their respective values
replace_dict = {
    'eng': 'en', 'en-US': 'en', 'en-CA': 'en', 'spa': 'es', 'en-GB': 'en', 'fre': 'fr',
    'nl': 'nl', 'ara': 'ar', 'por': 'pt', 'ger': 'de', 'nor': 'no', 'jpn': 'ja', 'en': 'en',
    'vie': 'vi', 'ind': 'id', 'pol': 'pl', 'tur': 'tr', 'dan': 'da', 'fil': 'tl', 'ita': 'it',
    'per': 'fa', 'swe': 'sv', 'rum': 'ro', 'rus': 'ru'
}

# Replace language codes
processed_df['language'].replace(replace_dict, inplace=True)

# Print unique languages after replacement
unique_languages = processed_df['language'].unique()
print(unique_languages)

# Append additional details to Markdown file
with open('../markdown/ds3_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS3 - After clean\n")
    file.write("\n## Total books: " + str(len(processed_df)))
    file.write("\n## Total Unique ISBNs: " + str(len(processed_df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(processed_df['title'].unique())))
    file.write("\n## Total Unique Languages: " + str(len(unique_languages)))
    file.write("\n<details><summary>Unique Languages</summary>\n\n")
    for lang in unique_languages:
        file.write("\n- " + str(lang))
    file.write("\n\n</details>\n")
