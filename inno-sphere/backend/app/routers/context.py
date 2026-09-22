"""Weather, satellite and alerts."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, Farm, User
from ..services import weather as weather_service
from ..services import satellite as satellite_service
from ..services import soil as soil_service
from .auth import current_user

router = APIRouter(tags=["context"])


@router.get("/weather")
async def weather(lat: float = 28.669, lon: float = 77.453):
    return await weather_service.fetch(lat, lon)


@router.get("/soil-estimate")
async def soil_estimate(lat: float = 28.669, lon: float = 77.453):
    return await soil_service.estimate(lat, lon)


@router.get("/satellite/{farm_id}")
async def satellite(farm_id: int, db: Session = Depends(get_db),
                    user: User = Depends(current_user)):
    farm = db.get(Farm, farm_id)
    if not farm or farm.user_id != user.id:
        raise HTTPException(404, "Farm not found.")
    stored = (farm.boundary_geojson or {}).get("zones") if farm else None
    return await satellite_service.field_zones(farm_id, stored)


@router.get("/alerts/{farm_id}")
async def alerts(farm_id: int, db: Session = Depends(get_db),
                 user: User = Depends(current_user)):
    """Stored alerts plus live ones derived from current weather."""
    farm = db.get(Farm, farm_id)
    if not farm or farm.user_id != user.id:
        raise HTTPException(404, "Farm not found.")
    stored = db.query(Alert).filter_by(farm_id=farm_id, acknowledged=False).all()
    out = [{"level": a.level, "title": a.title, "reason": a.reason,
            "action": a.action} for a in stored]

    wx = await weather_service.fetch(farm.latitude if farm else 28.669,
                                     farm.longitude if farm else 77.453)
    if wx["humid_nights"] >= 3:
        out.append({
            "level": "risk",
            "title": "Weather favours fungal leaf disease",
            "reason": (f"Humidity stays above 78% on {wx['humid_nights']} of the next "
                       "five nights. Fungal leaf disease develops fastest in these "
                       "conditions. This is raised risk, not a confirmed problem."),
            "action": "Check the lower leaves today",
        })
    return out
