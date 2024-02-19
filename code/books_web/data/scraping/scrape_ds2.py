import pandas as pd
import json

# Load the CSV file
df = pd.read_csv('../not_processed_data/DS2.csv')

# Process and extract unique categories
all_categories = []
for cat_str in df['categories'].dropna():
    try:
        categories_list = json.loads(cat_str.replace("'", '"'))
        all_categories.extend(categories_list)
    except json.JSONDecodeError:
        continue

unique_categories = set(all_categories)

# Prepare the formatted data
df['title'] = df['title']
df['authors'] = df['brand'].apply(lambda x: [x] if pd.notna(x) else [])
df['cover'] = df['image_url']
df['amazonLink'] = df['url']

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

# Replace "" with ' in the actors column
df['authors'] = df['authors'].str.replace('""', "'")

# Define a function to split or keep categories as per your requirements
def process_categories(categories):
    new_categories = []
    for category in categories:
        if category == 'Intelligence & Espionage':
            new_categories.extend(['Espionage', 'Intelligence'])
        elif category == 'Action & Adventure':
            new_categories.extend(['Action', 'Adventure'])
        elif category == 'Cultural Heritage':
            new_categories.extend(['Cultural', 'Heritage'])
        elif category == 'LGBTQ+ Books':
            new_categories.extend(['LGBTQ+'])
        elif category == 'Greek & Roman':
            new_categories.extend(['Greek', 'Roman'])
        elif category == 'International Mystery & Crime':
            new_categories.extend(['International', 'Mystery', 'Crime'])
        elif category == 'Probability & Statistics':
            new_categories.extend(['Probability', 'Statistics'])
        elif category == 'Teen & Young Adult':
            new_categories.extend(['Teen', 'Young Adult'])
        elif category == 'Prejudice & Racism':
            new_categories.extend(['Prejudice', 'Racism'])
        elif category == 'Motivation & Self-Improvement':
            new_categories.extend(['Motivation', 'Self-Improvement'])
        elif category == 'Education & Training':
            new_categories.extend(['Education', 'Training'])
        elif category == 'History & Criticism':
            new_categories.extend(['History', 'Criticism'])
        elif category == 'Trivia & Fun Facts':
            new_categories.extend(['Trivia', 'Fun Facts'])
        elif category == 'Weapons & Warfare':
            new_categories.extend(['Weapons', 'Warfare'])
        elif category == 'Civil Rights & Liberties':
            new_categories.extend(['Civil Rights', 'Liberties'])
        elif category == 'Analysis & Strategy':
            new_categories.extend(['Analysis', 'Strategy'])
        elif category == 'Discrimination & Racism':
            new_categories.extend(['Discrimination', 'Racism'])
        elif category == 'History & Theory':
            new_categories.extend(['History', 'Theory'])
        elif category == 'Regional & Cultural':
            new_categories.extend(['Regional', 'Cultural'])
        elif category == 'Churches & Church Leadership':
            new_categories.extend(['Churches', 'Church Leadership'])
        elif category == 'Politics & Government':
            new_categories.extend(['Politics', 'Government'])
        elif category == 'Dramas & Plays':
            new_categories.extend(['Dramas', 'Plays'])
        elif category == 'Rich & Famous':
            new_categories.extend(['Rich', 'Famous'])
        elif category == 'Short Stories & Anthologies':
            new_categories.extend(['Short Stories', 'Anthologies'])
        elif category == 'Literature & Fiction':
            new_categories.extend(['Literature', 'Fiction'])
        elif category == 'Antiques & Collectibles':
            new_categories.extend(['Antiques', 'Collectibles'])
        elif category == 'Cooking Education & Reference':
            new_categories.extend(['Cooking', 'Education', 'Reference'])
        elif category == 'Food & Wine':
            new_categories.extend(['Food', 'Wine'])
        elif category == 'Ethics & Morality':
            new_categories.extend(['Ethics', 'Morality'])
        elif category == 'Grief & Bereavement':
            new_categories.extend(['Grief', 'Bereavement'])
        elif category == 'Black & African Americans':
            new_categories.extend(['Black', 'African American'])
        elif category == 'Photography & Video':
            new_categories.extend(['Photography', 'Video'])
        elif category == 'Education & Teaching':
            new_categories.extend(['Education', 'Teaching'])
        elif category == 'New Adult & College':
            new_categories.extend(['New Adult', 'College'])
        elif category == 'Dating & Sex':
            new_categories.extend(['Dating', 'Sex'])
        elif category == 'Afghan & Iraq Wars':
            new_categories.extend(['Afghan War', 'Iraq War'])
        elif category == 'Research & Publishing Guides':
            new_categories.extend(['Research', 'Publishing Guides'])
        elif category == 'Arts & Literature':
            new_categories.extend(['Art', 'Literature'])
        elif category == 'Puzzles & Games':
            new_categories.extend(['Puzzles', 'Game'])
        elif category == 'Pets & Animal Care':
            new_categories.extend(['Pets', 'Animal Care'])
        elif category == 'Ethnic Studies':
            new_categories.extend(['Ethnic', 'Studies'])
        elif category == 'Decision-Making & Problem Solving':
            new_categories.extend(['Decision-Making', 'Problem-Solving'])
        elif category == 'Occult & Paranormal':
            new_categories.extend(['Occult', 'Paranormal'])
        elif category == 'Professionals & Academics':
            new_categories.extend(['Professionals', 'Academics'])
        elif category == 'Leadership & Motivation':
            new_categories.extend(['Leadership', 'Motivation'])
        elif category == 'Toys & Games':
            new_categories.extend(['Toys', 'Game'])
        elif category == 'Humor & Entertainment':
            new_categories.extend(['Humor', 'Entertainment'])
        elif category == 'Mythology & Folk Tales':
            new_categories.extend(['Mythology', 'Folk Tales'])
        elif category == 'Music & Photography':
            new_categories.extend(['Music', 'Photography'])
        elif category == 'Video Game Adaptations':
            new_categories.extend(['Video Game', 'Adaptations'])
        elif category == 'Education & Reference':
            new_categories.extend(['Education', 'Reference'])
        elif category == 'Myths & Legends':
            new_categories.extend(['Myths', 'Legends'])
        elif category == 'Used & Rental Textbooks':
            new_categories.extend(['Used', 'Rental Textbooks'])
        elif category == 'Thrillers & Suspense':
            new_categories.extend(['Thriller', 'Suspense'])
        elif category == 'Thriller & Suspense':
            new_categories.extend(['Thriller', 'Suspense'])
        elif category == 'Medicine & Health Sciences':
            new_categories.extend(['Medicine', 'Health Sciences'])
        elif category == 'Job Hunting & Careers':
            new_categories.extend(['Job Hunting', 'Careers'])
        elif category == 'Budgeting & Money Management':
            new_categories.extend(['Budgeting', 'Money Management'])
        elif category == 'Religion & Spirituality':
            new_categories.extend(['Religion', 'Spirituality'])
        elif category == 'Computers & Technology':
            new_categories.extend(['Computers', 'Technology'])
        elif category == 'Engineering & Transportation':
            new_categories.extend(['Engineering', 'Transportation'])
        elif category == 'Mystery & Thriller':
            new_categories.extend(['Mystery', 'Thriller'])
        elif category == 'Caretaking & Relocating':
            new_categories.extend(['Caretaking', 'Relocating'])
        elif category == 'Social Scientists & Psychologists':
            new_categories.extend(['Social Scientists', 'Psychologists'])
        elif category == 'Small Town & Rural':
            new_categories.extend(['Small Town', 'Rural'])
        elif category == 'Love & Romance':
            new_categories.extend(['Love', 'Romance'])
        elif category == 'Administration & Medicine Economics':
            new_categories.extend(['Administration', 'Medicine Economics'])
        elif category == 'Cognitive Psychology':
            new_categories.extend(['Cognitive', 'Psychology'])
        elif category == 'Endocrinology & Metabolism':
            new_categories.extend(['Endocrinology', 'Metabolism'])
        elif category == 'Rituals & Practice':
            new_categories.extend(['Rituals', 'Practice'])
        elif category == 'Fitness & Dieting':
            new_categories.extend(['Fitness', 'Diet'])
        elif category == 'Detoxes & Cleanses':
            new_categories.extend(['Detoxes', 'Cleanses'])
        elif category == 'Black & African American':
            new_categories.extend(['Black', 'African American'])
        elif category == 'Home Improvement & Design':
            new_categories.extend(['Home Improvement', 'Design'])
        elif category == 'Crime & Criminal Biographies':
            new_categories.extend(['Crime', 'Criminal Biographies'])
        elif category == 'Bible Study & Reference':
            new_categories.extend(['Bible', 'Study', 'Reference'])
        elif category == 'Direction & Production':
            new_categories.extend(['Direction', 'Production'])
        elif category == 'Science & Math':
            new_categories.extend(['Sciences', 'Mathematics'])
        elif category == 'Management & Leadership':
            new_categories.extend(['Management', 'Leadership'])
        elif category == 'Politics & Social Sciences':
            new_categories.extend(['Politics', 'Social Sciences'])
        elif category == 'British & Irish':
            new_categories.extend(['British', 'Irish'])
        elif category == 'Actors & Entertainers':
            new_categories.extend(['Actors', 'Entertainers'])
        elif category == 'Sports & Outdoors':
            new_categories.extend(['Sports', 'Outdoors'])
        elif category == 'Espionage':
            new_categories.extend(['Espionage', 'Spies'])
        elif category == 'Parenting & Relationships':
            new_categories.extend(['Parenting', 'Relationships'])
        elif category == 'Econometrics & Statistics':
            new_categories.extend(['Econometrics', 'Statistics'])
        elif category == 'Astronomy & Space Science':
            new_categories.extend(['Astronomy', 'Space Science'])
        elif category == 'Diseases & Physical Ailments':
            new_categories.extend(['Diseases', 'Physical Ailments'])
        elif category == 'Orphans & Foster Homes':
            new_categories.extend(['Orphans', 'Foster Homes'])
        elif category == 'Worship & Devotion':
            new_categories.extend(['Worship', 'Devotion'])
        elif category == 'Patents & Inventions':
            new_categories.extend(['Patents', 'Inventions'])
        elif category == 'Canning & Preserving':
            new_categories.extend(['Canning', 'Preserving'])
        elif category == 'Spies & Politics':
            new_categories.extend(['Spies', 'Politics', 'Espionage'])
        elif category == 'Learning & Education':
            new_categories.extend(['Learning', 'Education'])
        elif category == 'Encyclopedias & Subject Guides':
            new_categories.extend(['Encyclopedias', 'Subject Guides'])
        elif category == 'Privacy & Surveillance':
            new_categories.extend(['Privacy', 'Surveillance'])
        elif category == 'Presidents & Heads of State':
            new_categories.extend(['Presidents', 'Heads of State'])
        elif category == 'Exercise & Fitness':
            new_categories.extend(['Exercise', 'Fitness'])
        elif category == 'Biographies & Memoirs':
            new_categories.extend(['Biographies', 'Memoirs'])
        elif category == 'Schools & Teaching':
            new_categories.extend(['Schools', 'Teaching'])
        elif category == 'Hobbies & Home':
            new_categories.extend(['Hobbies', 'Home'])
        elif category == 'Comics & Graphic Novels':
            new_categories.extend(['Comics', 'Graphic Novels'])
        elif category == 'Social & Family Issues':
            new_categories.extend(['Social', 'Family Issues'])
        elif category == 'Broadway & Musicals':
            new_categories.extend(['Broadway', 'Musical'])
        elif category == 'Ideologies & Doctrines':
            new_categories.extend(['Ideologies', 'Doctrines'])
        elif category == 'Regional & International':
            new_categories.extend(['Regional', 'International'])
        elif category == 'Community & Culture':
            new_categories.extend(['Community', 'Culture'])
        elif category == 'Atlases & Maps':
            new_categories.extend(['Atlases', 'Maps'])
        elif category == 'Arts & Photography':
            new_categories.extend(['Art', 'Photography'])
        elif category == 'Civilization & Culture':
            new_categories.extend(['Civilization', 'Culture'])
        elif category == 'Witchcraft & Paganism':
            new_categories.extend(['Witchcraft', 'Paganism'])
        elif category == 'Death & Grief':
            new_categories.extend(['Death', 'Grief'])
        elif category == 'How-to & Home Improvements':
            new_categories.extend(['How-to', 'Home Improvement'])
        elif category == 'Leaders & Notable People':
            new_categories.extend(['Leaders', 'Notable People'])
        elif category == 'Values & Virtues':
            new_categories.extend(['Values', 'Virtues'])
        elif category == 'African Descent & Black':
            new_categories.extend(['African Descent', 'Black'])
        elif category == 'New Age & Spirituality':
            new_categories.extend(['New Age', 'Spirituality'])
        elif category == 'Fairy Tales & Folklore':
            new_categories.extend(['Fairy Tales', 'Folklore'])
        elif category == 'Metaphysical & Visionary':
            new_categories.extend(['Metaphysical', 'Visionary'])
        elif category == 'Humor & Satire':
            new_categories.extend(['Humor', 'Satire'])
        elif category == 'Business & Money':
            new_categories.extend(['Business', 'Money'])
        elif category == 'Crafts & Hobbies':
            new_categories.extend(['Crafts', 'Hobbies'])
        elif category == 'Main Courses & Side Dishes':
            new_categories.extend(['Main Courses', 'Side Dishes'])
        elif category == 'Christian Books & Bibles':
            new_categories.extend(['Christian', 'Bible'])
        elif category == 'Mental & Spiritual Healing':
            new_categories.extend(['Mental', 'Spiritual'])
        elif category == 'Death & Dying':
            new_categories.extend(['Death', 'Dying'])
        elif category == 'States & Local':
            new_categories.extend(['State', 'Local'])
        elif category == 'Science Fiction & Fantasy':
            new_categories.extend(['Science-Fiction', 'Fantasy'])
        elif category == 'Conservatism & Liberalism':
            new_categories.extend(['Conservatism', 'Liberalism'])
        elif category == 'Psychology & Counseling':
            new_categories.extend(['Psychology', 'Counseling'])
        elif category == 'Diets & Weight Loss':
            new_categories.extend(['Diet', 'Weight Loss'])
        else:
            # Split the category by spaces and add to new_categories
            new_categories.extend([cat for cat in category.split() if cat != '&' and cat not in new_categories])


    return new_categories
df['categories'] = df['categories'].apply(process_categories)

def remove_duplicates_from_categories(categories_list):
    # Replace specific words and remove duplicates while maintaining order
    replacements = {"Animals": "Animal", "Bibles": "Bible", "Movies": "Movie", "Thrillers": "Thriller"}
    seen = set()
    cleaned_categories = []
    for category in categories_list:
        # Replace specific words
        category = replacements.get(category, category)
        # Trim trailing commas and exclude unwanted words
        category = category.rstrip(',')
        if category not in ['&', 'by', 'of']:
            cleaned_categories.append(category)

    # Remove duplicates
    return [x for x in cleaned_categories if not (x in seen or seen.add(x))]
df['categories'] = df['categories'].apply(remove_duplicates_from_categories)


all_categories_flat = [category for sublist in df['categories'] for category in sublist]
unique_categories = set(all_categories_flat)
with open('../markdown/ds2_categories.md', 'w') as file:
    file.write("\n---\n")
    file.write("\n# DS2 - Before clean\n")
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

with open('../markdown/ds2_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS2 - After clean\n")
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
missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'kindleLink', 'audibleLink', 'fnacLink']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('../processed_data/processed_DS2.csv', index=False)


with open('../markdown/ds2_categories.md', 'a') as file:
    file.write("\n---\n")
    file.write("\n# DS2 - Summary\n")
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
    