"""Image quality gate.

Runs before any diagnosis. Rejects photos that cannot support a reliable
assessment, and tells the farmer exactly what to fix. Uses OpenCV only —
no trained model is involved at this stage.
"""
from dataclasses import dataclass, asdict

import cv2
import numpy as np

MIN_SIDE = 600
DARK, BRIGHT = 52, 212
MIN_CONTRAST = 14
MIN_SHARPNESS = 22
MIN_PLANT_PCT = 8.0

RETAKE_MESSAGE = {
    "en": "Please retake the photo in better lighting and keep the affected "
          "plant area clearly visible.",
    "hi": "कृपया बेहतर रोशनी में दोबारा फोटो लें और प्रभावित पौधे का हिस्सा "
          "साफ दिखाई देना चाहिए।",
}


@dataclass
class Quality:
    score: int
    issues: list[str]
    brightness: float
    contrast: float
    sharpness: float
    plant_pct: float
    usable: bool

    def dict(self):
        return asdict(self)


def plant_mask(bgr: np.ndarray) -> np.ndarray:
    """Rough vegetation mask in HSV. Green hue band, reasonable saturation."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    return cv2.inRange(hsv, (22, 40, 40), (95, 255, 255))


def assess(bgr: np.ndarray) -> Quality:
    h, w = bgr.shape[:2]
    small = cv2.resize(bgr, (480, max(1, int(480 * h / w))))
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    brightness = float(gray.mean())
    contrast = float(gray.std())
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    plant_pct = float((plant_mask(small) > 0).mean() * 100)

    issues: list[str] = []
    if min(h, w) < MIN_SIDE:
        issues.append("resolution_low")
    if brightness < DARK:
        issues.append("too_dark")
    if brightness > BRIGHT:
        issues.append("overexposed")
    if contrast < MIN_CONTRAST:
        issues.append("flat_or_hazy")
    if sharpness < MIN_SHARPNESS:
        issues.append("blurred")
    if plant_pct < MIN_PLANT_PCT:
        issues.append("plant_not_visible")

    score = 100 - len(issues) * 17 - max(0, (40 - min(sharpness, 40)) * 0.6)
    score = int(max(8, min(99, round(score))))

    return Quality(score, issues, round(brightness, 1), round(contrast, 1),
                   round(sharpness, 1), round(plant_pct, 1), usable=score >= 55)


def preprocess(bgr: np.ndarray, target: int = 1024) -> np.ndarray:
    """Resize, denoise and normalise contrast before feeding any vision model."""
    h, w = bgr.shape[:2]
    if max(h, w) > target:
        scale = target / max(h, w)
        bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    bgr = cv2.bilateralFilter(bgr, 5, 50, 50)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
