"""Optional multimodel computer vision pipeline.

OpenCV remains the guaranteed fallback. YOLO and PyTorch are loaded lazily so
the API can deploy without large model packages or weights. Model outputs are
evidence and confidence signals; they do not replace human confirmation.
"""
import json
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

from ..config import settings


@lru_cache(maxsize=1)
def _yolo():
    if not settings.yolo_model_path or not Path(settings.yolo_model_path).exists():
        return None
    try:
        from ultralytics import YOLO
        return YOLO(settings.yolo_model_path)
    except (ImportError, RuntimeError, ValueError):
        return None


@lru_cache(maxsize=1)
def _classifier():
    if not settings.pytorch_model_path or not Path(settings.pytorch_model_path).exists():
        return None, []
    try:
        import torch
        labels = json.loads(Path(settings.pytorch_labels_path).read_text(encoding="utf-8")) if settings.pytorch_labels_path else []
        model = torch.jit.load(settings.pytorch_model_path, map_location=settings.vision_device)
        model.eval()
        return model, labels
    except (ImportError, OSError, RuntimeError, ValueError, json.JSONDecodeError):
        return None, []


def status() -> dict:
    yolo = _yolo()
    classifier, labels = _classifier()
    return {
        "opencv": True,
        "yolo": yolo is not None,
        "pytorch": classifier is not None and bool(labels),
        "grad_cam": classifier is not None,
        "device": settings.vision_device,
    }


def _classifier_result(image: np.ndarray, model, labels: list[str]) -> dict | None:
    try:
        import torch
        rgb = cv2.cvtColor(cv2.resize(image, (224, 224)), cv2.COLOR_BGR2RGB)
        tensor = torch.from_numpy(rgb.transpose(2, 0, 1)).float().div(255).unsqueeze(0)
        tensor.requires_grad_(True)
        output = model(tensor)
        logits = output[0] if isinstance(output, (tuple, list)) else output
        probabilities = torch.softmax(logits, dim=1)[0]
        values, indices = torch.topk(probabilities, min(3, len(probabilities)))
        result = {
            "model": "PyTorch classifier",
            "top": {"label": labels[int(indices[0])], "confidence": round(float(values[0]), 3)},
            "alternatives": [{"label": labels[int(index)], "confidence": round(float(value), 3)}
                             for value, index in zip(values[1:], indices[1:])],
        }
        grad_cam = _grad_cam(model, tensor, int(indices[0]))
        if grad_cam:
            result["xai"] = grad_cam
        return result
    except (ImportError, RuntimeError, IndexError, TypeError):
        return None


def _grad_cam(model, tensor, class_index: int) -> dict | None:
    """Summarize a Grad-CAM heatmap when the optional package/model supports it."""
    try:
        from pytorch_grad_cam import GradCAM
        from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
        import torch

        layers = [module for module in model.modules() if isinstance(module, torch.nn.Conv2d)]
        if not layers:
            return None
        cam = GradCAM(model=model, target_layers=[layers[-1]])
        heatmap = cam(input_tensor=tensor, targets=[ClassifierOutputTarget(class_index)])[0]
        return {
            "method": "Grad-CAM",
            "highlight_fraction": round(float((heatmap >= 0.6).mean()), 3),
            "target_class": class_index,
        }
    except (ImportError, RuntimeError, AttributeError, TypeError, ValueError):
        return None


def _yolo_result(image: np.ndarray, model) -> dict | None:
    try:
        results = model.predict(image, device=settings.vision_device, verbose=False)
        result = results[0]
        detections = []
        if result.boxes is not None:
            for cls, confidence in zip(result.boxes.cls.tolist(), result.boxes.conf.tolist()):
                name = result.names.get(int(cls), str(int(cls)))
                detections.append({"label": name, "confidence": round(float(confidence), 3)})
        return {"model": "YOLO", "detections": detections[:20],
                "segmentation": bool(result.masks is not None)}
    except (RuntimeError, ValueError, IndexError, AttributeError):
        return None


def analyze(image: np.ndarray, crop: str, quality_score: int) -> dict:
    """Run configured model adapters and calculate a conservative confidence."""
    classifier, labels = _classifier()
    classifier_result = _classifier_result(image, classifier, labels) if classifier else None
    yolo_result = _yolo_result(image, _yolo()) if _yolo() else None
    model_confidence = classifier_result["top"]["confidence"] if classifier_result else None
    confidence = round((quality_score / 100) * model_confidence, 3) if model_confidence is not None else None
    return {
        "crop": crop,
        "classification": classifier_result,
        "detection": yolo_result,
        "confidence": confidence,
        "explainability": "Grad-CAM is included when the configured PyTorch model exposes a convolution layer.",
        "note": "Model predictions are advisory and must be confirmed with field evidence.",
    }