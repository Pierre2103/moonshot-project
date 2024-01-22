import pandas as pd

# Load the CSV file
df = pd.read_csv('DS1.csv')

# Extract unique categories
unique_categories = df['category'].unique()

# # Print the results
# print("\nUnique Categories:")
# print(unique_categories)
## Unique Categories: ['Medical' 'Science-Geography' 'Art-Photography' 'Biography' 'Business-Finance-Law' 'Childrens-Books' 'Computing' 'Crafts-Hobbies' 'Crime-Thriller' 'Dictionaries-Languages' 'Entertainment' 'Food-Drink' 'Graphic-Novels-Anime-Manga' 'Health' 'History-Archaeology' 'Home-Garden' 'Humour' 'Mind-Body-Spirit' 'Natural-History' 'Personal-Development' 'Poetry-Drama' 'Reference' 'Religion' 'Romance' 'Science-Fiction-Fantasy-Horror' 'Society-Social-Sciences' 'Sport' 'Stationery' 'Teaching-Resources-Education' 'Technology-Engineering' 'Teen-Young-Adult' 'Transport' 'Travel-Holiday-Guides']

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

# Save to a new CSV file
processed_df.to_csv('processed_DS1.csv', index=False)
