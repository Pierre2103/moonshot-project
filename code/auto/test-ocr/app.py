import cv2
import numpy as np
from skimage.transform import probabilistic_hough_line
import pytesseract
from scipy import ndimage

# (a): Image d'entrée
image = cv2.imread('book1.png', cv2.IMREAD_GRAYSCALE)
cv2.imwrite('a_input_image.jpg', image)

# (b): Redressement (deskewing) de l'image
edges = cv2.Canny(image, 50, 150, apertureSize=3)
lines = probabilistic_hough_line(edges)
angles = []




best_angle = None
min_difference = float('inf')  # Initialisez à l'infini pour être sûr de trouver une valeur plus petite

combinations = [(0, 1), (1, 0), (1, 1)]

for comb in combinations:
    angles = []
    for line in lines:
        p0, p1 = line
        angle = np.arctan2(p1[comb[0]]-p0[comb[0]], p1[comb[1]]-p0[comb[1]])
        angles.append(angle)
    
    median_angle = np.median(angles)
    difference = abs(np.degrees(median_angle))
    
    if difference < min_difference:
        min_difference = difference
        best_angle = median_angle

print("Meilleur angle (en radians) :", best_angle)
print("Meilleur angle (en degrés) :", np.degrees(best_angle))

deskewed = ndimage.rotate(image,(best_angle))

# Sauvegardez l'image redressée
cv2.imwrite('deskewed_image.jpg', deskewed)



cv2.line(image, (0, 0), (int(image.shape[1]), 0), (255, 0, 0), 2)
cv2.line(image, (0, int(image.shape[0])), (int(image.shape[1]), int(image.shape[0])), (255, 0, 0), 2)
cv2.line(image, (0, 0), (int(image.shape[1]), int(image.shape[1]*np.tan(median_angle))), (255, 0, 0), 2)
cv2.imwrite('b_lines.jpg', image)
print(np.degrees(median_angle))
# deskewed = ndimage.rotate(image, np.degrees(median_angle))
cv2.imwrite('b_deskewed.jpg', deskewed)

# (c): Détecter les régions avec MSER
mser = cv2.MSER_create()
regions, _ = mser.detectRegions(deskewed)
for region in regions:
    hull = cv2.convexHull(region.reshape(-1, 1, 2))
    cv2.polylines(deskewed, [hull], 1, (255, 0, 0))
cv2.imwrite('c_mser_regions.jpg', deskewed)

# (d): Trouver la boîte englobante
bounding_boxes = []
for region in regions:
    x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
    bounding_boxes.append((x, y, w, h))
    cv2.rectangle(deskewed, (x, y), (x+w, y+h), (255, 0, 0), 2)
cv2.imwrite('d_bounding_boxes.jpg', deskewed)

# Supprimer les boîtes englobantes qui sont entièrement contenues dans une autre boîte

filtered_boxes = []
for i in range(len(bounding_boxes)):
    contained = False
    for j in range(len(bounding_boxes)):
        if i == j:
            continue
        x1_i, y1_i, x2_i, y2_i = bounding_boxes[i]
        x1_j, y1_j, x2_j, y2_j = bounding_boxes[j]

        # Vérifiez si la boîte i est entièrement contenue dans la boîte j
        if x1_i >= x1_j and y1_i >= y1_j and x2_i <= x2_j and y2_i <= y2_j:
            contained = True
            break

    if not contained:
        filtered_boxes.append(bounding_boxes[i])

# Dessinez les boîtes filtrées sur l'image
image_with_filtered_boxes = deskewed.copy()
for (x1, y1, x2, y2) in filtered_boxes:
    cv2.rectangle(image_with_filtered_boxes, (x1, y1), (x2, y2), (0, 255, 0), 2)

# Sauvegardez l'image avec les boîtes filtrées
cv2.imwrite('d_filtered_bounding_boxes.jpg', image_with_filtered_boxes)


# (e) : Retirer les boîtes englobantes non alignées
heights = [box[3] - box[1] for box in bounding_boxes]
mean_height = np.mean(heights)
cv2.line(deskewed, (0, int(mean_height/2)), (int(deskewed.shape[1]), int(mean_height/2)), (255, 0, 0), 2)
cv2.imwrite('e_mean_height.jpg', deskewed)

aligned_boxes = [box for box in bounding_boxes if box[3] - box[1] > mean_height / 2]
for box in aligned_boxes:
    cv2.rectangle(deskewed, (box[0], box[1]), (box[2], box[3]), (255, 0, 0), 2)
cv2.imwrite('e_aligned_boxes.jpg', deskewed)

# (f) : Fusionner les boîtes englobantes
merged_boxes = []

while aligned_boxes:
    # Extraction de la première boîte
    main_box = aligned_boxes[0]
    
    # Trouver les boîtes qui se chevauchent avec la boîte principale
    to_merge = [box for box in aligned_boxes if not (box[2] < main_box[0] or box[0] > main_box[2] 
                                                    or box[3] < main_box[1] or box[1] > main_box[3])]
    
    if not to_merge:
        continue

    x1 = min(box[0] for box in to_merge)
    y1 = min(box[1] for box in to_merge)
    x2 = max(box[2] for box in to_merge)
    y2 = max(box[3] for box in to_merge)
    
    merged_boxes.append((x1, y1, x2, y2))
    cv2.rectangle(deskewed, (x1, y1), (x2, y2), (255, 0, 0), 2)
    cv2.imwrite('f_merged_boxes.jpg', deskewed)
    
    # Retirer les boîtes fusionnées de la liste principale
    for box in to_merge:
        aligned_boxes.remove(box)


# Lecture des caractères dans chaque boîte englobante
custom_config = r'--psm 10'
for box in merged_boxes:
    x, y, w, h = box
    roi = deskewed[y:y+h, x:x+w]
    character = pytesseract.image_to_string(roi, config=custom_config)
    print(character.strip())

