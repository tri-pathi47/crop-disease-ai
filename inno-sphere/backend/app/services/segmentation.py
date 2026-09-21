"""Symptom segmentation.

Right now this is a colour-based heuristic: it separates healthy green tissue
from yellowed and necrotic tissue and reports what fraction of the leaf area
has changed colour. It is deliberately simple and explainable.

TO REPLACE WITH A REAL MODEL: keep the same return shape and swap the body for
a U-Net / YOLOv8-seg inference call. Nothing downstream needs to change.
"""
import cv2
import numpy as np

from .image_quality import plant_mask

HEALTHY, YELLOW, NECROTIC = 0, 1, 2


def segment(bgr: np.ndarray) -> dict:
    """Split leaf tissue into healthy, yellowed and necrotic.

    The analysis region is healthy tissue PLUS symptomatic tissue. Building it
    from the green mask alone would hide exactly what we are looking for, since
    brown necrotic tissue sits outside the green hue band.
    """
    small = cv2.resize(bgr, (320, max(1, int(320 * bgr.shape[0] / bgr.shape[1]))))
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    healthy = (h >= 35) & (h <= 95) & (s > 40) & (v > 40)
    yellowish = (h >= 18) & (h < 35) & (s > 60) & (v > 90)
    necrotic = (((h < 18) | (h > 170)) & (s > 45) & (v > 25) & (v < 175))

    region = healthy | yellowish | necrotic
    mask = np.zeros(region.shape, np.uint8)
    mask[yellowish] = YELLOW
    mask[necrotic] = NECROTIC

    # Remove speckle so a few stray pixels do not read as a lesion.
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    plant_px = int(region.sum())
    yellow_px = int((mask == YELLOW).sum())
    necrotic_px = int((mask == NECROTIC).sum())
    lesion_px = yellow_px + necrotic_px

    return {
        "mask": mask,
        "plant_px": plant_px,
        "lesion_px": lesion_px,
        "lesion_pct": round(lesion_px / plant_px * 100, 1) if plant_px else 0.0,
        "yellow_share": round(yellow_px / lesion_px, 2) if lesion_px else 0.0,
        "necrotic_share": round(necrotic_px / lesion_px, 2) if lesion_px else 0.0,
    }


def overlay_png(bgr: np.ndarray, mask: np.ndarray) -> bytes:
    """Evidence image: affected pixels tinted red over the original photo.

    Stands in for Grad-CAM until a real classifier exists. Label it in the UI
    as a colour heuristic, not model attention.
    """
    out = bgr.copy()
    m = cv2.resize(mask, (out.shape[1], out.shape[0]), interpolation=cv2.INTER_NEAREST)
    tint = np.zeros_like(out)
    tint[m > 0] = (30, 40, 214)  # BGR red
    out = cv2.addWeighted(out, 1.0, tint, 0.45, 0)
    return cv2.imencode(".png", out)[1].tobytes()
