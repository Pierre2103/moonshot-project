import cv2
import pytesseract
import time
import argparse
from ultralytics import YOLO

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
            # Check if the current box is close to the previous box
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
        # Capture frame-by-frame
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break
        
        frame_counter += 1
        small_frame = cv2.resize(frame, (640, 360))
        # . gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
        
        if frame_counter % 5 == 0:
            # d = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT) # faster but less accurate
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

        # print the text in a txt file for further processing
        with open('output_ocr.txt', 'a') as f:
            for box in merged_boxes:
                f.write(box[1] + '\n')

        cv2.imshow('Video Stream', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            # post-process the text in the txt file by sorting and removing duplicates
            with open('output_ocr.txt', 'r') as f:
                lines = f.readlines()
                lines = list(set(lines))
                lines.sort()
            
            with open('output_ocr.txt', 'w') as f:
                for line in lines:
                    f.write(line)

            break

def perform_classification(cap):
    model = YOLO('yolov8s-cls.pt')  # Load the specified YOLOv8 classification model
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame.")
            break

        # Preprocess the frame for classification
        small_frame = cv2.resize(frame, (224, 224))  # Resize to the input size expected by the model
        results = model(small_frame)

        # Get the predicted class and confidence
        if results and len(results) > 0:
            result = results[0]
            if result.probs is not None:
                top_class = result.probs.top1
                top_confidence = result.probs.top1conf
                label = f"{model.names[top_class]}: {top_confidence:.2f}"

                # Display the label on the frame
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