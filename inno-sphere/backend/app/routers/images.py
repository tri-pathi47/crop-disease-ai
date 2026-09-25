"""Photo upload and the quality gate."""
import uuid
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import CropImage, CropCycle, User
from ..schemas import QualityOut
from ..services import image_quality, segmentation, storage
from .auth import current_user

router = APIRouter(prefix="/images", tags=["images"])
VIEWS = {"whole", "top", "under", "stem", "fruit", "damage", "soil"}


def _read(upload: UploadFile) -> np.ndarray:
    raw = np.frombuffer(upload.file.read(), np.uint8)
    img = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "That file could not be read as an image.")
    return img


@router.post("/upload", response_model=QualityOut)
async def upload(
    crop_cycle_id: int = Form(...),
    view_type: str = Form(...),
    file: UploadFile = File(...),
    language: str = Form("en"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    cycle = db.get(CropCycle, crop_cycle_id)
    if not cycle or cycle.farm.user_id != user.id:
        raise HTTPException(404, "Crop cycle not found.")
    if view_type not in VIEWS:
        raise HTTPException(400, f"view_type must be one of {sorted(VIEWS)}")

    img = _read(file)
    quality = image_quality.assess(img)

    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    path = Path(settings.upload_dir) / f"{uuid.uuid4().hex}.jpg"
    stored_path = await storage.save_image(image_quality.preprocess(img), path)

    row = CropImage(
        crop_cycle_id=crop_cycle_id, view_type=view_type, file_path=stored_path,
        quality_score=quality.score, quality_issues=quality.issues,
        features=quality.dict(),
    )
    db.add(row)
    db.commit()

    return QualityOut(
        image_id=row.id, view_type=view_type, score=quality.score,
        issues=quality.issues, usable=quality.usable,
        message=None if quality.usable
        else image_quality.RETAKE_MESSAGE.get(language, image_quality.RETAKE_MESSAGE["en"]),
    )


@router.get("/{image_id}/evidence.png")
def evidence(image_id: int, db: Session = Depends(get_db),
             user: User = Depends(current_user)):
    """Affected regions tinted over the original photo."""
    row = db.get(CropImage, image_id)
    cycle = db.get(CropCycle, row.crop_cycle_id) if row else None
    if not row or not cycle or cycle.farm.user_id != user.id:
        raise HTTPException(404, "Image not found.")
    img = storage.read_image(row.file_path)
    if img is None:
        raise HTTPException(503, "The stored image is temporarily unavailable.")
    seg = segmentation.segment(img)
    return Response(segmentation.overlay_png(img, seg["mask"]), media_type="image/png")
