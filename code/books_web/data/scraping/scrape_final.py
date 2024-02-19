import pandas as pd
import numpy as np

# Read processed datasets
df1 = pd.read_csv('../processed_data/processed_DS1.csv')
df2 = pd.read_csv('../processed_data/processed_DS2.csv')
df3 = pd.read_csv('../processed_data/processed_DS3.csv')
df4 = pd.read_csv('../processed_data/processed_DS4.csv')
df5 = pd.read_csv('../processed_data/processed_DS5.csv')
df6 = pd.read_csv('../processed_data/processed_DS6.csv')

# Concatenate datasets
final_df = pd.concat([df1, df2, df3, df4, df5, df6], ignore_index=True)

# Remove hyphens from ISBN
final_df['ISBN'] = final_df['ISBN'].str.replace('-', '')

# Remove leading and trailing spaces from title and convert it to string
final_df['title'] = final_df['title'].str.strip().astype(str)

# Replace single quotes with double quotes in title
final_df['title'] = final_df['title'].str.replace("'", '"')

books_without_isbn = final_df['ISBN'].isna().sum()
books_without_title = final_df['title'].isna().sum()
books_without_author = final_df['authors'].apply(lambda x: len(x) if isinstance(x, list) else 0).eq(0).sum()
books_without_cover = final_df['cover'].isna().sum()
books_without_summary = final_df['summary'].isna().sum()
books_without_language = final_df['language'].isna().sum()
books_without_categories = final_df['categories'].apply(lambda x: len(x) if isinstance(x, list) else 0).eq(0).sum()
books_without_editor = final_df['editor'].isna().sum()
books_without_publication_year = final_df['publicationYear'].isna().sum()
books_without_pages_number = final_df['pagesNumber'].isna().sum()
books_without_amazon_link = final_df['amazonLink'].isna().sum()
books_without_kindle_link = final_df['kindleLink'].isna().sum()
books_without_audible_link = final_df['audibleLink'].isna().sum()
books_without_fnac_link = final_df['fnacLink'].isna().sum()
books_without_rating = final_df['rating'].isna().sum()

# Write details to Markdown file
with open('../markdown/final_dataset_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# All Dataset - Before clean counts 738 197\n")
    file.write("\n---\n")
    file.write("\n# Final Dataset - Before clean\n")
    file.write("\n## Total books: " + str(len(final_df)))
    file.write("\n## Total Unique ISBNs: " + str(len(final_df['ISBN'].unique())))
    file.write("\n## Total Unique Titles: " + str(len(final_df['title'].unique())))

# Drop duplicates based on ISBN and title
final_df.drop_duplicates(subset=['ISBN'], inplace=True)
final_df.drop_duplicates(subset=['title'], inplace=True)

# Sort by title alphabetically
final_df.sort_values(by=['title'], inplace=True)

# Generate IDs
ids = ['b' + str(i).zfill(10) for i in range(1, len(final_df) + 1)]

# Add IDs to the dataframe
final_df['book_id'] = ids

# Save to a new CSV file
final_df.to_csv('../processed_data/FINAL_DATASET.csv', index=False)

# Write details after cleaning to Markdown file
with open('../markdown/final_dataset_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# Final Dataset - After clean\n")
    file.write("\n## Total books: " + str(len(final_df)))
    # title,authors,cover,summary,language,categories,editor,publicationYear,pagesNumber,amazonLink,kindleLink,audibleLink,fnacLink,ISBN,rating

    file.write("\n## Total Unique ISBNs: " + str(len(final_df['ISBN'].unique())))
    file.write("\n#### Books without ISBN: " + str(books_without_isbn))
    file.write("\n## Total Unique Titles: " + str(len(final_df['title'].unique())))
    file.write("\n#### Books without Title: " + str(books_without_title))
    file.write("\n## Total Unique Authors: " + str(len(final_df['authors'].unique())))
    file.write("\n#### Books without Authors: " + str(books_without_author))
    file.write("\n## Total Unique Covers: " + str(len(final_df['cover'].unique())))
    file.write("\n#### Books without Cover: " + str(books_without_cover))
    file.write("\n## Total Unique Summaries: " + str(len(final_df['summary'].unique())))
    file.write("\n#### Books without Summary: " + str(books_without_summary))
    file.write("\n## Total Unique Languages: " + str(len(final_df['cover'].unique())))
    file.write("\n#### Books without Language: " + str(books_without_language))
    file.write("\n## Total Unique Categories: " + str(len(final_df['categories'].unique())))
    file.write("\n#### Books without Categories: " + str(books_without_categories))
    file.write("\n## Total Unique Editors: " + str(len(final_df['editor'].unique())))
    file.write("\n#### Books without Editor: " + str(books_without_editor))
    file.write("\n## Total Unique Publication Years: " + str(len(final_df['publicationYear'].unique())))
    file.write("\n#### Books without Publication Year: " + str(books_without_publication_year))
    file.write("\n## Total Unique Pages Number: " + str(len(final_df['pagesNumber'].unique())))
    file.write("\n#### Books without Pages Number: " + str(books_without_pages_number))
    file.write("\n## Total Unique Amazon Links: " + str(len(final_df['amazonLink'].unique())))
    file.write("\n#### Books without Amazon Link: " + str(books_without_amazon_link))
    file.write("\n## Total Unique Kindle Links: " + str(len(final_df['kindleLink'].unique())))
    file.write("\n#### Books without Kindle Link: " + str(books_without_kindle_link))
    file.write("\n## Total Unique Audible Links: " + str(len(final_df['audibleLink'].unique())))
    file.write("\n#### Books without Audible Link: " + str(books_without_audible_link))
    file.write("\n## Total Unique Fnac Links: " + str(len(final_df['fnacLink'].unique())))
    file.write("\n#### Books without Fnac Link: " + str(books_without_fnac_link))
    file.write("\n## Total Unique Ratings: " + str(len(final_df['rating'].unique())))
    file.write("\n#### Books without Rating: " + str(books_without_rating))
    file.write("\n---\n")
    file.write("\n# 179 756 books have been deleted due to duplicates\n")
