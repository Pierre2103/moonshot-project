# Monthly Report for Pierre's Moonshot Project
**Reporting Period:** January 2024

**Author:** Pierre GORIN

## Summary
During the first month of 2024 I focused mainly on finding some datasets related to books, I discovered 6 datasets that I've merged to have a large amount of data to insert in the database, for the moment I just have a CSV file, Next month I will focus on the database and the backend.

## Objectives
### Current Month Objectives
- Objective 1: Find datasets related to books
- Objective 2: Process and clean each dataset
- Objective 3: Merge all datasets into a single file
- Objective 4: Follow the progress of the project as a To Do List using the Obsidian software

### Next Month Objectives
- Objective 1: Find the technologies for the database
- Objective 2: Create the database
- Objective 3: Insert the data in the database
- Objective 4: Find the technologies for the backend
- Objective 5: Find the technologies for the AI side

## Achievements
I found a large amount of books with the name, the author(s), the cover and others informations, before cleaning the data I had 738 197 books, after cleaning the data I have 558 441 books, I've deleted 179 756 books due to duplicates.

## Challenges and Solutions
It was challenging to find datasets that I can exploit, Fortunately I found somes. Then to clean and merge the datasets I write a python script that do the job for each dataset, you can find the scripts in `code/books_web/data/scraping` or clicking [here](../../../code/books_web/data/scraping/).

To clean the data I've used the `pandas` library.

To merge the datasets I've used the `pandas` library too and the dataset is available in `code/books_web/data/processed_data/FINAL_DATASET.csv` or clicking [here](../../../code/books_web/data/processed_data/FINAL_DATASET.csv)

The next challenge will be to find the good technologies of database that isn't too expensive and that can handle a large amount of data.
Then I will have to find the good technologies for the backend and the AI side.

Also you can find the To Do List of the project in the Obsidian software by clicking [here](../../../obsidian/POC%20-%20To%20Do%20List.md)

## Project Metrics

- Number of commits: 2
- Number of lines of code added: 1 039 528 (mainly due to the datasets)

## Upcoming Milestones and Deliverables

Ideally, I would like to have the following milestones and deliverables completed in the next 5 months:

- February 2024: Database and Backend
- March 2024: AI Side
- April 2024: Frontend
- May 2024: Testing

## Conclusion

I'm happy with the progress of the project, I've found a large amount of data and I've cleaned it, next month I will focus on the database and the backend.
I need to commit more to have a better tracking of the project.
I will also need to find the good technologies to avoid any problems in the future.
I need to think about the scalability of the project right now to avoid problems if there are a large amount of users on my platform.