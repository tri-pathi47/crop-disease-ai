from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Farm, CropCycle, SoilRecord, User
from ..schemas import FarmIn, FarmOut, CropIn, CropOut, SoilIn
from .auth import current_user

router = APIRouter(tags=["farm"])


@router.get("/farms", response_model=list[FarmOut])
def list_farms(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Farm).filter_by(user_id=user.id).all()


@router.post("/farms", response_model=FarmOut)
def create_farm(body: FarmIn, db: Session = Depends(get_db),
                user: User = Depends(current_user)):
    farm = Farm(user_id=user.id, **body.model_dump())
    db.add(farm)
    db.commit()
    return farm


@router.put("/farms/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, body: FarmIn, db: Session = Depends(get_db),
                user: User = Depends(current_user)):
    farm = db.get(Farm, farm_id)
    if not farm or farm.user_id != user.id:
        raise HTTPException(404, "Farm not found.")
    for k, v in body.model_dump().items():
        setattr(farm, k, v)
    db.commit()
    return farm


@router.get("/crops", response_model=list[CropOut])
def list_crops(farm_id: int, db: Session = Depends(get_db),
               user: User = Depends(current_user)):
    return db.query(CropCycle).filter_by(farm_id=farm_id).all()


@router.post("/crops", response_model=CropOut)
def create_crop(body: CropIn, db: Session = Depends(get_db),
                user: User = Depends(current_user)):
    cycle = CropCycle(**body.model_dump())
    db.add(cycle)
    db.commit()
    return cycle


@router.post("/soil")
def add_soil(body: SoilIn, db: Session = Depends(get_db),
             user: User = Depends(current_user)):
    record = SoilRecord(**body.model_dump())
    db.add(record)
    db.commit()
    return {"id": record.id, "saved": True}


@router.get("/soil/{farm_id}")
def get_soil(farm_id: int, db: Session = Depends(get_db),
             user: User = Depends(current_user)):
    record = (db.query(SoilRecord).filter_by(farm_id=farm_id)
              .order_by(SoilRecord.tested_on.desc()).first())
    if not record:
        raise HTTPException(404, "No soil record yet. Add your soil health card.")
    return record
