# === image_encoder.py (compatible CLIPModel multimodal) ===
from PIL import Image, UnidentifiedImageError
from io import BytesIO
import numpy as np
import torch

def encode_image(image_bytes, model, processor, device):
    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))

        inputs = processor(text=[""], images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            return outputs.image_embeds[0].cpu().numpy()

    except UnidentifiedImageError:
        print("❌ Image illisible")
        return None
    except Exception as e:
        print("🔥 encode_image crash:", e)
        return None
