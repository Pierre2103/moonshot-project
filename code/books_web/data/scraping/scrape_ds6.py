import pandas as pd

# Load the CSV file
df = pd.read_csv('../not_processed_data/DS6.csv', delimiter=',', encoding='utf-8', dtype=str)

# Write initial details to Markdown file
with open('../markdown/ds6_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS6 - Before clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['asin'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['booksTitle'].unique())))

# Prepare the formatted data
df['title'] = df['booksTitle']
df['authors'] = df['booksAuthors'].apply(lambda x: [x])
df['cover'] = df['amazonImage']
df['ISBN'] = df['asin']
df['categories'] = df['categories']

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'rating']
for col in missing_columns:
    df[col] = ''
    
# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS6.csv', index=False)

# Remove duplicates based on ISBN and title
df.drop_duplicates(subset=['asin'], inplace=True)
df.drop_duplicates(subset=['booksTitle'], inplace=True)

# Write additional details to Markdown file after cleaning
with open('../markdown/ds6_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS6 - After clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['asin'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['booksTitle'].unique())))
