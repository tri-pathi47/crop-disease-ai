"""Optional CNN inference adapter.

The model is intentionally external to the codebase. Configure an ONNX model
and a JSON label list when a validated multi-crop model is available. Without
both files, the product keeps using its transparent image measurements.
"""
import json
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

from ..config import settings


@lru_cache(maxsize=1)
def _model():
    if not settings.cnn_model_path or not Path(settings.cnn_model_path).exists():
        return None, []
    labels = []
    if settings.cnn_labels_path and Path(settings.cnn_labels_path).exists():
        labels = json.loads(Path(settings.cnn_labels_path).read_text(encoding="utf-8"))
    return cv2.dnn.readNetFromONNX(settings.cnn_model_path), labels


def configured() -> bool:
    net, labels = _model()
    return net is not None and bool(labels)


def predict(image: np.ndarray, crop: str) -> dict | None:
    """Return the model ranking, or None until a validated model is configured."""
    net, labels = _model()
    if net is None or not labels:
        return None
    try:
        blob = cv2.dnn.blobFromImage(
            image, scalefactor=1 / 255.0, size=(224, 224),
            mean=(0, 0, 0), swapRB=True, crop=False,
        )
        net.setInput(blob)
        raw = net.forward().reshape(-1).astype(np.float64)
        probabilities = np.exp(raw - raw.max())
        probabilities /= probabilities.sum() or 1
        ranked = sorted(zip(labels, probabilities), key=lambda item: -item[1])[:3]
        return {
            "crop": crop,
            "model": "ONNX CNN",
            "top": {"label": ranked[0][0], "confidence": round(float(ranked[0][1]), 3)},
            "alternatives": [{"label": label, "confidence": round(float(score), 3)}
                             for label, score in ranked[1:]],
            "note": "Model output is advisory and should be confirmed with field evidence.",
        }
    except (cv2.error, ValueError, IndexError):
        return None