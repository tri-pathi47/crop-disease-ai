from datetime import date
from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    name: str
    password: str
    language: str = "hi"


class LoginIn(BaseModel):
    name: str | None = None
    password: str
    phone: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FarmerOut(BaseModel):
    id: int
    name: str
    language: str
    state: str | None = None
    district: str | None = None
    village: str | None = None
    land_area_ha: float | None = None
    experience_years: int | None = None

    class Config:
        from_attributes = True


class FarmerUpdate(BaseModel):
    name: str | None = None
    state: str | None = None
    district: str | None = None
    village: str | None = None
    land_area_ha: float | None = None
    experience_years: int | None = None


class FarmIn(BaseModel):
    name: str
    latitude: float | None = None
    longitude: float | None = None
    area_ha: float | None = None
    soil_type: str | None = None
    boundary_geojson: dict | None = None


class FarmOut(FarmIn):
    id: int

    class Config:
        from_attributes = True


class CropIn(BaseModel):
    farm_id: int
    crop: str
    variety: str | None = None
    sowing_date: date | None = None
    growth_stage: str | None = None


class CropOut(CropIn):
    id: int

    class Config:
        from_attributes = True


class SoilIn(BaseModel):
    farm_id: int
    tested_on: date | None = None
    source: str = "farmer_entry"
    soil_type: str | None = None
    ph: float | None = None
    ec: float | None = None
    organic_carbon: float | None = None
    nitrogen: float | None = None
    phosphorus: float | None = None
    potassium: float | None = None
    sulphur: float | None = None
    zinc: float | None = None
    iron: float | None = None
    manganese: float | None = None
    boron: float | None = None


class QualityOut(BaseModel):
    image_id: int
    view_type: str
    score: int
    issues: list[str]
    usable: bool
    message: str | None = None


class AnalyseIn(BaseModel):
    crop_cycle_id: int
    image_ids: list[int]
    farmer_note: str = ""


class Candidate(BaseModel):
    key: str
    label: str
    share: int


class DiagnosisOut(BaseModel):
    id: int | None = None
    primary: str
    plain_language: dict[str, str]
    differential: list[Candidate]
    confidence: str
    severity: str
    evidence: list[dict]
    actions: list[str]
    needs_more_evidence: bool
    next_photo_request: str | None = None
    sources: list[dict]
    scoring_note: str = Field(
        default=("Shares come from transparent rules over measured image features "
                 "and farm context, not a calibrated classifier. Treat them as a "
                 "ranking, not a probability."))


class ChatIn(BaseModel):
    question: str
    crop_cycle_id: int | None = None
    language: str = "en"
