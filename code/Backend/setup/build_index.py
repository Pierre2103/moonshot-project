import os
import json
import gc
import torch
import faiss
import numpy as np
from PIL import Image, UnidentifiedImageError
from tqdm import tqdm
from transformers import CLIPProcessor, CLIPModel

# === CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COVERS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "covers"))
OUTPUT_INDEX = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "index.faiss"))
OUTPUT_FEATURES = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "image_features.npy"))
OUTPUT_NAMES = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "image_names.json"))
SKIPPED_FILE = os.path.join(BASE_DIR, "data", "skipped_images.txt")

# === SETUP ===
device = "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

def encode_image(path: str) -> np.ndarray:
    try:
        image = Image.open(path).convert("RGB")
        image = image.resize((224, 224))  # Sécurité contre les tailles erratiques

        # Dummy input_ids to avoid CLIP error
        inputs = processor(images=image, return_tensors="pt")
        inputs["input_ids"] = torch.tensor([[0]])  # Hack to satisfy CLIPModel
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            embedding = outputs.image_embeds[0].cpu().numpy()

        del image, inputs, outputs
        gc.collect()
        return embedding

    except (UnidentifiedImageError, Exception) as e:
        raise RuntimeError(f"{path}: {e}")

def get_all_images() -> list:
    return sorted([
        f for f in os.listdir(COVERS_DIR)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ])

def encode_all_images():
    all_features = []
    all_names = []
    skipped = []

    files = get_all_images()
    print(f"📦 Encoding {len(files)} images from '{COVERS_DIR}'...")

    for fname in tqdm(files):
        path = os.path.join(COVERS_DIR, fname)
        try:
            embedding = encode_image(path)
            all_features.append(embedding)
            all_names.append(fname)
        except Exception as e:
            skipped.append(fname)
            print(f"❌ Skipped {fname}: {e}")

    if skipped:
        with open(SKIPPED_FILE, "w") as f:
            f.write("\n".join(skipped))
        print(f"\n⚠️ {len(skipped)} images skipped. See '{SKIPPED_FILE}' for details.")

    return np.stack(all_features), all_names

def save_index(features: np.ndarray, names: list):
    print("💾 Saving index and metadata...")
    index = faiss.IndexFlatL2(features.shape[1])
    index.add(features)

    faiss.write_index(index, OUTPUT_INDEX)
    np.save(OUTPUT_FEATURES, features)
    with open(OUTPUT_NAMES, "w") as f:
        json.dump(names, f)

    print(f"✅ Index built with {len(names)} images.")

def add_to_index(isbn):
    """
    Ajoute une nouvelle couverture (isbn) à l'index FAISS existant, aux features et aux noms.
    """
    cover_path = os.path.join(COVERS_DIR, f"{isbn}.jpg")
    print(f"add_to_index: cover_path={cover_path}, exists={os.path.exists(cover_path)}")
    if not os.path.exists(cover_path):
        print(f"❌ Couverture introuvable pour ISBN {isbn} ({cover_path})")
        return False

    # Charger l'index existant
    if not (os.path.exists(OUTPUT_INDEX) and os.path.exists(OUTPUT_FEATURES) and os.path.exists(OUTPUT_NAMES)):
        print("❌ Index, features ou noms manquants. Lance d'abord build_index.")
        return False

    # Charger l'index FAISS
    index = faiss.read_index(OUTPUT_INDEX)
    features = np.load(OUTPUT_FEATURES)
    with open(OUTPUT_NAMES, "r") as f:
        names = json.load(f)

    # Encoder la nouvelle image
    try:
        embedding = encode_image(cover_path)
        print(f"❗ Image encodée avec succès pour {isbn}: shape={embedding.shape}")
    except Exception as e:
        print(f"❌ Erreur d'encodage pour {isbn}: {e}")
        return False

    # Ajouter à l'index et aux listes
    embedding = embedding.reshape(1, -1)
    index.add(embedding)
    features = np.vstack([features, embedding])
    names.append(f"{isbn}.jpg")

    # Sauvegarder
    faiss.write_index(index, OUTPUT_INDEX)
    np.save(OUTPUT_FEATURES, features)
    with open(OUTPUT_NAMES, "w") as f:
        json.dump(names, f)

    print(f"✅ ISBN {isbn} ajouté à l'index FAISS.")
    return True



if __name__ == "__main__":
    features, names = encode_all_images()
    save_index(features, names)
