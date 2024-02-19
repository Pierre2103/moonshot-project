import pandas as pd

# Try different encodings if 'latin1' does not work, such as 'cp1252', 'utf-16', etc.
encoding = 'latin1'

# Load the CSV file with specified encoding
df = pd.read_csv('../not_processed_data/DS4.csv', delimiter=';', encoding=encoding)

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

df['ISBN'] = df['ISBN_010a']
df['editor'] = df['Editeur_210c']
df['publicationYear'] = df['Annee_edition_210d'].fillna('').apply(lambda x: str(x) if x else '')

# The dataset does not seem to contain a cover image URL, so we'll leave it empty
df['cover'] = ''

# The dataset does not seem to contain categories, so we'll leave it empty
df['categories'] = ''

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'rating']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Write initial details to Markdown file
with open('../markdown/ds4_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS4 - Before clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['title'].unique())))

# Remove duplicates based on ISBN and title
df.drop_duplicates(subset=['ISBN'], inplace=True)
df.drop_duplicates(subset=['title'], inplace=True)

# Write additional details to Markdown file after cleaning
with open('../markdown/ds4_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS4 - After clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['title'].unique())))

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS4.csv', index=False)