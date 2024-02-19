import pandas as pd

# Load the CSV file
file_path = '../not_processed_data/DS5.csv'
df = pd.read_csv(file_path, delimiter=';', encoding='ISO-8859-1', dtype=str)

# Check the column names
print(df.columns)

# If the column names are different, adjust them accordingly
# For example, if 'Book-Title' is the correct column name instead of 'title', replace it below
# df['title'] = df['Book-Title']

# Write initial details to Markdown file
with open('../markdown/ds5_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS5 - Before clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    # Add a check to ensure the correct column name for titles
    if 'Book-Title' in df.columns:
        file.write("\n## Total Unique Titles: " + str(len(df['Book-Title'].unique())))
    else:
        file.write("\n## Total Unique Titles: N/A")

# Prepare the formatted data
df['title'] = df['Book-Title']
df['authors'] = df['Book-Author'].apply(lambda x: [x])
df['cover'] = df['Image-URL-L']
df['ISBN'] = df['ISBN']

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'rating']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS5.csv', index=False)

# Remove duplicates based on ISBN and title
df.drop_duplicates(subset=['ISBN'], inplace=True)
if 'Book-Title' in df.columns:
    df.drop_duplicates(subset=['Book-Title'], inplace=True)

# Write additional details to Markdown file after cleaning
with open('../markdown/ds5_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS5 - After clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    if 'Book-Title' in df.columns:
        file.write("\n## Total Unique Titles: " + str(len(df['Book-Title'].unique())))
    else:
        file.write("\n## Total Unique Titles: N/A")
