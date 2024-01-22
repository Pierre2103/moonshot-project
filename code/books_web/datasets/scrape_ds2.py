import pandas as pd
import json

# Load the CSV file
df = pd.read_csv('DS2.csv')

# Process and extract unique categories
all_categories = []
for cat_str in df['categories'].dropna():
    try:
        categories_list = json.loads(cat_str.replace("'", '"'))
        all_categories.extend(categories_list)
    except json.JSONDecodeError:
        continue

unique_categories = set(all_categories)

# # # Print the results
# print("\nUnique Categories:")
# print(unique_categories)
# # Unique Categories: {'Intelligence & Espionage', 'Graphic Novels', 'Asia', 'Action & Adventure', 'Cultural Heritage', 'LGBTQ+ Books', 'Greek & Roman', 'International Mystery & Crime', 'Investing', 'Writing', 'Probability & Statistics', 'Classics', 'Teen & Young Adult', 'Serial Killers', 'Survival Stories', 'Prejudice & Racism', 'Personal Finance', 'Motivation & Self-Improvement', 'Religious', 'Private Investigators', 'Ancient', 'Education & Training', 'History & Criticism', 'Christian Living', 'Trivia & Fun Facts', 'Buddhism', 'Weapons & Warfare', 'Dystopian', 'Civil Rights & Liberties', 'Analysis & Strategy', 'Discrimination & Racism', 'Anthologies', 'Wicca', 'History & Theory', 'Historical', 'Weddings', 'Regional & Cultural', 'Video', 'Churches & Church Leadership', 'Native American', 'Coming of Age', 'Politics & Government', 'Dark Fantasy', 'Vampires', 'Longevity', 'Family', 'Dramas & Plays', 'Calendars', 'Happiness', 'Rich & Famous', 'Short Stories & Anthologies', 'American Revolution', 'Holocaust', 'Literature & Fiction', 'Political', 'Democracy', 'Alternative Medicine', 'Antiques & Collectibles', 'Electronic Learning Toys', 'Management', 'Engineering', 'Occult', 'Cozy', 'Scottish', 'Cooking Education & Reference', 'Authors', 'Cookbooks, Food & Wine', 'Social Issues', 'Europe', 'Ethics & Morality', 'Mental Health', 'Grief & Bereavement', 'Black & African Americans', 'Strategy', 'Photography & Video', 'Education & Teaching', 'New Adult & College', 'Dating & Sex', 'Police Procedurals', 'Applied Psychology', 'Afghan & Iraq Wars', 'Holidays', 'Conventional', 'Contemporary', 'Race Relations', '20th Century', 'Social Theory', 'Writing, Research & Publishing Guides', 'Operating Systems', 'Arts & Literature', 'Puzzles & Games', 'Neuroscience', 'True Crime', 'Pets & Animal Care', 'Guides', 'Ethnic Studies', 'National', 'Biographies', 'Adventure', 'General', 'Peer Pressure', 'Nursing', 'Decision-Making & Problem Solving', 'Occult & Paranormal', 'Afghan War', 'Professionals & Academics', 'Poetry', 'Leadership & Motivation', 'Biographical', 'Iraq War', 'Behavioral Sciences', 'Psychological', 'New Thought', 'Toys & Games', 'Gothic', 'Humor & Entertainment', 'Medical', 'Romantic Comedy', 'Stocks', 'Individual Sports', 'Judicial Branch', 'Mythology & Folk Tales', 'Graphic Design', 'Space Opera', 'Art, Music & Photography', 'TV, Movie, Video Game Adaptations', 'Epic', 'Workplace Culture', 'Education & Reference', 'Urban', 'Myths & Legends', 'Mythology', 'New, Used & Rental Textbooks', 'Dogs', 'Thrillers & Suspense', 'Medical Books', 'Authorship', 'Thriller & Suspense', 'Medicine & Health Sciences', 'Canada', 'Domestic', 'Job Hunting & Careers', 'City Life', 'Horror', 'World War II', 'Time Travel', 'Biological Sciences', 'Drawing', 'Vigilante Justice', 'Budgeting & Money Management', 'Sleep Disorders', 'Fortune Telling', 'Amateur Sleuths', 'Religion & Spirituality', 'Social Sciences', 'Legal', 'Computers & Technology', 'Literary', 'Engineering & Transportation', 'Motivational', 'Siblings', 'Mystery & Thriller', 'Parents', 'Divination', 'Cleaning, Caretaking & Relocating', 'Traditional Detectives', 'Personal Transformation', 'Humor', 'Social Scientists & Psychologists', 'Small Town & Rural', 'Poverty', 'Love & Romance', 'Family Life', 'Reference', 'Administration & Medicine Economics', 'Cognitive Psychology', 'Endocrinology & Metabolism', 'Rituals & Practice', 'Health, Fitness & Dieting', 'Detoxes & Cleanses', 'Mystery', 'American Civil War', 'Animals', 'Black & African American', 'Wealth Management', 'Indigenous', 'Popular', 'Home Improvement & Design', 'Introduction', 'Crime & Criminal Biographies', 'Economics', 'Baking', 'Pathology', 'Bible Study & Reference', 'Business', 'Quick & Easy', 'Direction & Production', 'Musical Genres', 'Theater', 'Science & Math', 'Hard Science Fiction', 'Psychology', 'Movies', 'Supernatural', 'Family Relationships', 'Management & Leadership', 'Manga', 'Sea Stories', 'Politics & Social Sciences', 'British & Irish', 'Actors & Entertainers', 'Sports & Outdoors', 'Espionage', 'Parenting & Relationships', 'Jewish', 'Venture Capital', 'Econometrics & Statistics', 'Humorous', 'Business Culture', 'Astronomy & Space Science', 'Corporate Finance', 'Mystery, Thriller & Suspense', 'Diseases & Physical Ailments', 'Special Diet', 'Orphans & Foster Homes', 'Internal Medicine', 'Worship & Devotion', 'Romantic', 'Canadian', 'Finance', 'Neurology', 'Psychological Thrillers', 'Industries', 'World Literature', 'Patents & Inventions', 'Canning & Preserving', 'Paranormal & Urban', 'Executive Branch', 'Spies & Politics', 'Learning & Education', 'Encyclopedias & Subject Guides', 'Ghosts', 'Paranormal', 'Viral', 'Privacy & Surveillance', 'Presidents & Heads of State', 'Public Health', 'Americas', 'Exercise & Fitness', 'Psoriasis', 'Biographies & Memoirs', 'Schools & Teaching', 'Crafts, Hobbies & Home', 'Comics & Graphic Novels', 'Social & Family Issues', 'Fantasy', 'Women Sleuths', 'Witchcraft', 'Broadway & Musicals', 'Genre Fiction', 'Philosophy', 'Family Saga', 'Ideologies & Doctrines', 'Political Science', 'Suspense', 'Women', 'Personality', 'Regional & International', 'Community & Culture', 'Erotica', 'Crime', 'Atlases & Maps', 'Arts & Photography', 'United States', 'Civilization & Culture', 'Romance', 'Mathematics', 'Aging', 'African American Studies', 'Applied', 'Medicine', 'Wicca, Witchcraft & Paganism', 'Negotiating', 'Great Britain', 'Death & Grief', 'How-to & Home Improvements', 'Diseases', 'Leaders & Notable People', 'World', 'Values & Virtues', 'African Descent & Black', 'Urban Life', 'New Age & Spirituality', 'Chemistry', 'Fairy Tales & Folklore', 'History', 'Friendship', 'Statistics', 'France', 'Metaphysical & Visionary', 'Weight Training', 'Scotland', 'Satire', 'European', 'Travel', 'Creativity', 'Humor & Satire', 'Publishing & Books', 'Business & Money', 'Sociology', 'LGBTQ+', 'Crafts & Hobbies', 'Main Courses & Side Dishes', 'U.S. Presidents', 'Reincarnation', 'Books', 'Christian Books & Bibles', 'Military', 'Music', 'Relationships', 'Cooking Methods', 'Science Fiction', 'Cooking by Ingredient', 'Mental & Spiritual Healing', 'Christianity', 'Bibles', 'Specific Topics', 'Death & Dying', 'State & Local', 'Science Fiction & Fantasy', 'Kitchen Appliances', 'Sports', 'Conservatism & Liberalism', 'Self-Help', 'Meditation', 'Health Care Delivery', 'Other Diets', 'Psychology & Counseling', 'Diets & Weight Loss', 'Performing Arts'}

# Prepare the formatted data
df['title'] = df['title']
df['authors'] = df['brand'].apply(lambda x: [x] if pd.notna(x) else [])
df['cover'] = df['image_url']

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

# Add missing columns with default empty strings
missing_columns = ['summary', 'language', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink']
for col in missing_columns:
    df[col] = ''

# Define columns for the new DataFrame
new_columns = ['title', 'authors', 'cover', 'summary', 'language', 'categories', 'editor', 'publicationYear', 'pagesNumber', 'amazonLink', 'kindleLink', 'audibleLink', 'fnacLink', 'ISBN', 'rating']

# Create a new DataFrame with the required structure
processed_df = df[new_columns].copy()

# Save to a new CSV file
processed_df.to_csv('processed_DS2.csv', index=False)
