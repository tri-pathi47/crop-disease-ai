"""Image storage with Cloudinary persistence and local development fallback."""
import hashlib
import time
import urllib.request
from pathlib import Path

import cv2
import httpx
import numpy as np

from ..config import settings


def configured() -> bool:
    return bool(settings.cloudinary_cloud_name and settings.cloudinary_api_key
                and settings.cloudinary_api_secret)


async def save_image(img: np.ndarray, local_path: Path) -> str:
    """Return a durable URL when configured, otherwise a local path."""
    if not configured():
        local_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(local_path), img)
        return str(local_path)

    ok, encoded = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        raise ValueError("Could not encode image for storage")
    timestamp = str(int(time.time()))
    folder = "inno-sphere/crop-images"
    public_id = local_path.stem
    signature_text = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{settings.cloudinary_api_secret}"
    signature = hashlib.sha1(signature_text.encode()).hexdigest()
    url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload"
    files = {"file": (f"{public_id}.jpg", encoded.tobytes(), "image/jpeg")}
    data = {"api_key": settings.cloudinary_api_key, "timestamp": timestamp,
            "folder": folder, "public_id": public_id, "signature": signature}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, data=data, files=files)
        response.raise_for_status()
        return response.json()["secure_url"]


def read_image(path_or_url: str) -> np.ndarray | None:
    if path_or_url.startswith(("http://", "https://")):
        try:
            with urllib.request.urlopen(path_or_url, timeout=20) as response:
                raw = np.frombuffer(response.read(), np.uint8)
            return cv2.imdecode(raw, cv2.IMREAD_COLOR)
        except (OSError, ValueError):
            return None
    return cv2.imread(path_or_url)