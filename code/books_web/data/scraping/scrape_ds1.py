## Unique Categories: ['Medical' 'Science-Geography' 'Art-Photography' 'Biography' 'Business-Finance-Law' 'Childrens-Books' 'Computing' 'Crafts-Hobbies' 'Crime-Thriller' 'Dictionaries-Languages' 'Entertainment' 'Food-Drink' 'Graphic-Novels-Anime-Manga' 'Health' 'History-Archaeology' 'Home-Garden' 'Humour' 'Mind-Body-Spirit' 'Natural-History' 'Personal-Development' 'Poetry-Drama' 'Reference' 'Religion' 'Romance' 'Science-Fiction-Fantasy-Horror' 'Society-Social-Sciences' 'Sport' 'Stationery' 'Teaching-Resources-Education' 'Technology-Engineering' 'Teen-Young-Adult' 'Transport' 'Travel-Holiday-Guides']

# Graphic-Novels
# Natural-History
# Personal-Development
# Science-Fiction
# Social-Sciences
# Young-Adult


import pandas as pd

# Load the CSV file
df = pd.read_csv('../not_processed_data/DS1.csv')

# Extract unique categories
unique_categories = df['category'].unique()

# Prepare the formatted data
df['title'] = df['name']
df['authors'] = df['author'].apply(lambda x: [x])
df['cover'] = df['img_paths']
df['ISBN'] = df['isbn']
df['rating'] = df['book_depository_stars']

# Drop the unnecessary columns
df.drop(columns=['name', 'author', 'img_paths', 'isbn', 'book_depository_stars'], inplace=True)

# Add a " before and after the title
df['title'] = df['title'].apply(lambda x: '"' + x + '"')

# Remove every quotation mark from the titles
df['title'] = df['title'].str.replace('"', '')
df['title'] = df['title'].str.replace("'", '')

# Define a function to split or keep categories as per your requirements
def process_categories(category):
    if category == 'Graphic-Novels-Anime-Manga':
        return ['Graphic Novels', 'Anime', 'Manga']
    elif category == 'Natural-History':
        return ['Natural History']
    elif category == 'Personal-Development':
        return ['Personal Development']
    elif category == 'Science-Fiction-Fantasy-Horror':
        return ['Science Fiction', 'Fantasy', 'Horror']
    elif category == 'Society-Social-Sciences':
        return ['Society', 'Social Sciences']
    elif category == 'Teen-Young-Adult':
        return ['Teen', 'Young Adult']
    elif category == 'Childrens-Books':
        return ['Children\'s Books']
    elif category == 'Teaching-Resources-Education':
        return ['Teaching Resources', 'Education']
    else:
        return [x.replace('-', ' ') for x in category.split('-')]

# Modify categories column using the defined function
df['categories'] = df['category'].apply(process_categories)

all_categories_flat = [category for sublist in df['categories'] for category in sublist]
unique_categories = set(all_categories_flat)
with open('../markdown/ds1_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS1 - Before clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['title'].unique())))
    file.write("\n## Total Unique Categories: " + str(len(unique_categories)))
    file.write("\n<details>\n")
    file.write("\n### All categories Before clean:")
    for category in sorted(unique_categories):
        file.write(f"\n- {category}")
    file.write("\n</details>\n")

# remove duplicates ISBNs and titles
df.drop_duplicates(subset=['ISBN'], inplace=True)
df.drop_duplicates(subset=['title'], inplace=True)

# recalculating unique categories
all_categories_flat = [category for sublist in df['categories'] for category in sublist]
unique_categories = set(all_categories_flat)

with open('../markdown/ds1_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS1 - After clean\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Total Unique ISBNs: " + str(len(df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(df['title'].unique())))
    file.write("\n## Total Unique Categories: " + str(len(unique_categories)))
    file.write("\n<details>\n")
    file.write("\n### All categories After clean:")
    for category in sorted(unique_categories):
        file.write(f"\n- {category}")
    file.write("\n</details>\n")

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Sort by title alphabetically
processed_df.sort_values(by=['title'], inplace=True)

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS1.csv', index=False)

with open('../markdown/ds1_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS1 - Summary\n")
    file.write("\n## Total books: " + str(len(df)))
    file.write("\n## Books with ISBNs: " + str(len(df[df['ISBN'].notna()])))
    file.write("\n<details>\n")
    file.write("\n### Missing ISBNs:")
    # write the titles of the books with missing ISBNs
    for title in df[df['ISBN'].isna()]['title']:
        file.write(f"\n- {title}")
    file.write("\n</details>\n")
    file.write("\n## Books with Titles: " + str(len(df[df['title'].notna()])))
    file.write("\n## Books with Covers: " + str(len(df[df['cover'].notna()])))
    file.write("\n<details>\n")
    file.write("\n### Missing Covers:")
    # write the titles of the books and the ISBN with missing covers
    for title, ISBN in zip(df[df['cover'].isna()]['title'], df[df['cover'].isna()]['ISBN']):
        file.write(f"\n- {title} ({ISBN})")
    file.write("\n</details>\n")
    file.write("\n## Books with Categories: " + str(len(df[df['categories'].notna()]))) # 
    file.write("\n## Books with Amazon Links: " + str(len(df[df['amazonLink'].notna()]))) 
    file.write("\n## Books with Ratings: " + str(len(df[df['rating'].notna()])))
    