import cv2
import pytesseract
import time
import argparse
from ultralytics import YOLO
import csv
import re
import webbrowser

def merge_boxes(d, threshold=42):
    merged_boxes = []
    current_box = None
    current_text = ''

    for i in range(len(d['level'])):
        x, y, w, h = d['left'][i], d['top'][i], d['width'][i], d['height'][i]
        text = d['text'][i]

        if not text.strip():
            continue

        if current_box is None:
            current_box = [x, y, x + w, y + h]
            current_text = text
        else:
            if abs(y - current_box[1]) <= threshold and (x - current_box[2]) <= threshold:
                current_box[2] = x + w
                current_box[3] = max(current_box[3], y + h)
                current_text += ' ' + text
            else:
                merged_boxes.append((current_box, current_text))
                current_box = [x, y, x + w, y + h]
                current_text = text

    if current_box is not None:
        merged_boxes.append((current_box, current_text))

    return merged_boxes

def perform_ocr(cap):
    frame_counter = 0
    merged_boxes = []

    with open('output_ocr.txt', 'w') as f:
        f.write('')

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        frame_counter += 1
        small_frame = cv2.resize(frame, (640, 360))

        if frame_counter % 5 == 0:
            d = pytesseract.image_to_data(small_frame, output_type=pytesseract.Output.DICT)
            merged_boxes = merge_boxes(d)

        for box, text in merged_boxes:
            (x1, y1, x2, y2) = box
            x1, y1, x2, y2 = [int(coord * (frame.shape[1] / small_frame.shape[1])) for coord in [x1, y1, x2, y2]]
            frame = cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            frame = cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1, cv2.LINE_AA)

        print(f"Frame: {frame_counter}")
        print(f"Number of merged boxes: {len(merged_boxes)}")
        for box in merged_boxes:
            print(box)

        with open('output_ocr.txt', 'a') as f:
            for box in merged_boxes:
                f.write(box[1] + '\n')

        cv2.imshow('Video Stream', frame)

        if frame_counter >= 100:
            clean_ocr_output()
            break

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

def clean_ocr_output():
    with open('output_ocr.txt', 'r') as file:
        lines = file.readlines()
    lowercase_lines = [line.lower() for line in lines]
    cleaned_lines = [re.sub(r'[^a-zA-Z0-9\n]', ' ', line) for line in lowercase_lines]
    split_lines = [re.sub(r' +', '\n', line) for line in cleaned_lines]
    unique_lines = list(set(split_lines))
    unique_lines.sort()

    with open('words_alpha.txt', 'r') as file:
        words = file.readlines()
    words_set = set(word.strip().lower() for word in words)

    all_words = [word for line in unique_lines for word in line.split()]
    valid_words = [word for word in all_words if word in words_set and len(word) > 1]
    valid_words.sort()
    valid_words = list(set(valid_words))

    with open('output_ocr_clean.txt', 'w') as file:
        for word in valid_words:
            file.write(word + '\n')

    print(f"Number of valid words: {len(valid_words)}")

    matching_titles = []

    with open('FINAL_DATASET.csv', 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            title = row['title'].lower()
            title_words = re.findall(r'\b\w+\b', title)
            found_words = [word for word in valid_words if word in title_words]
            if found_words:
                correctness_rate = len(found_words)
                correctness_percentage = len(found_words) / len(title_words)
                weighted_correctness = correctness_percentage * len(title_words)
                matching_titles.append((row['title'], found_words, correctness_rate, correctness_percentage, weighted_correctness, row['cover']))

    with open('matching_titles.txt', 'w') as file:
        for title, found_words, correctness_rate, correctness_percentage, weighted_correctness, _ in matching_titles:
            file.write(f"{title} - {found_words} - {correctness_rate} - {correctness_percentage:.2f} - {weighted_correctness:.2f}\n")

    matching_titles.sort(key=lambda x: x[4], reverse=True)
    with open('Matching_titles.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Title', 'Found Words', 'Correctness Rate', 'Correctness Percentage', 'Weighted Correctness', 'Cover URL'])
        for title, found_words, correctness_rate, correctness_percentage, weighted_correctness, cover_url in matching_titles:
            writer.writerow([title, found_words, correctness_rate, f"{correctness_percentage:.2f}", f"{weighted_correctness:.2f}", cover_url])

    print(f"Number of matching titles: {len(matching_titles)}")

    if matching_titles:
        first_match = matching_titles[0]
        cover_url = first_match[5]
        webbrowser.open(cover_url)
        print("The book is: " + first_match)
        print("Here is the cover: " + cover_url)

    print("Done 👋")

def perform_classification(cap):
    model = YOLO('yolov8s-cls.pt')
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        small_frame = cv2.resize(frame, (224, 224))
        results = model(small_frame)

        if results and len(results) > 0:
            result = results[0]
            if result.probs is not None:
                top_class = result.probs.top1
                top_confidence = result.probs.top1conf
                label = f"{model.names[top_class]}: {top_confidence:.2f}"
                frame = cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

        cv2.imshow('Video Stream', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

def main():
    parser = argparse.ArgumentParser(description="Choose between OCR and YOLOv8 classification")
    parser.add_argument('mode', choices=['ocr', 'yolo'], help="Mode to run: 'ocr' for OCR, 'yolo' for YOLOv8 classification")
    args = parser.parse_args()

    mode = args.mode

    for i in range(3):
        print(f"Trying camera index {i}")
        cap = cv2.VideoCapture(i)

        if cap.isOpened():
            print(f"Successfully opened camera index {i}")
            break
        else:
            print(f"Could not open camera index {i}")

    if not cap.isOpened():
        print("Error: Could not open any video stream.")
        return

    if mode == 'ocr':
        perform_ocr(cap)
    elif mode == 'yolo':
        perform_classification(cap)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
