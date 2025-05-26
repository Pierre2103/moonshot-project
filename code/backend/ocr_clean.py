import csv
import re

# Read the OCR output file and convert to lowercase
with open('output_ocr.txt', 'r') as file:
    lines = file.readlines()
lowercase_lines = [line.lower() for line in lines]

# Replace special characters with a space
cleaned_lines = [re.sub(r'[^a-zA-Z0-9\n]', ' ', line) for line in lowercase_lines]

# Replace spaces with a newline (split the groups of words)
split_lines = [re.sub(r' +', '\n', line) for line in cleaned_lines]

# Remove duplicates
unique_lines = list(set(split_lines))
unique_lines.sort()

# Read the dictionary file and create a set of valid words (words_alpha.txt)
with open('words_alpha.txt', 'r') as file:
    words = file.readlines()
words_set = set(word.strip().lower() for word in words)

# Extract individual words from unique_lines
all_words = [word for line in unique_lines for word in line.split()]

# Check for valid words
valid_words = [word for word in all_words if word in words_set and len(word) > 1]

# Sort the words alphabetically
valid_words.sort()

# Remove duplicates
valid_words = list(set(valid_words))

# Final output of valid words
with open('output_ocr_clean.txt', 'w') as file:
    for word in valid_words:
        file.write(word + '\n')

print(f"Number of valid words: {len(valid_words)}")

# Search through the FINAL_DATASET.csv for titles containing any of the valid words
# and output each of the matching titles with a rate of correctness
matching_titles = []

with open('FINAL_DATASET.csv', 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        title = row['title'].lower()
        title_words = re.findall(r'\b\w+\b', title)  # Split the title into words
        found_words = [word for word in valid_words if word in title_words]
        if found_words:
            correctness_rate = len(found_words)
            correctness_percentage = len(found_words) / len(title_words)
            weighted_correctness = correctness_percentage * len(title_words)
            matching_titles.append((row['title'], found_words, correctness_rate, correctness_percentage, weighted_correctness, row['cover']))

# Write matching titles to a new file
with open('matching_titles.txt', 'w') as file:
    for title, found_words, correctness_rate, correctness_percentage, weighted_correctness, _ in matching_titles:
        file.write(f"{title} - {found_words} - {correctness_rate} - {correctness_percentage:.2f} - {weighted_correctness:.2f}\n")

# Output the matching titles in Matching_titles.csv sorted by weighted correctness
matching_titles.sort(key=lambda x: x[4], reverse=True)  # Sort by weighted correctness
with open('Matching_titles.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Title', 'Found Words', 'Correctness Rate', 'Correctness Percentage', 'Weighted Correctness', 'Cover URL'])
    for title, found_words, correctness_rate, correctness_percentage, weighted_correctness, cover_url in matching_titles:
        writer.writerow([title, found_words, correctness_rate, f"{correctness_percentage:.2f}", f"{weighted_correctness:.2f}", cover_url])

print(f"Number of matching titles: {len(matching_titles)}")

# Fetch the cover image of the first matching title
if matching_titles:
    first_match = matching_titles[0]
    cover_url = first_match[5]

    # Open a web browser and display the cover image
    import webbrowser

    webbrowser.open(cover_url)

print("Done")


#KEEP THIS VERSION, IT WORKS WELL
