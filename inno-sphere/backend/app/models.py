"""SQLAlchemy models. Mirrors db/schema.sql — keep the two in step."""
from datetime import datetime, date, timezone

from sqlalchemy import (
    String, Integer, Float, Text, Date, DateTime, ForeignKey, JSON, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120), default="Farmer")
    language: Mapped[str] = mapped_column(String(8), default="hi")
    voice_language: Mapped[str] = mapped_column(String(8), default="hi")
    state: Mapped[str | None] = mapped_column(String(80))
    district: Mapped[str | None] = mapped_column(String(80))
    village: Mapped[str | None] = mapped_column(String(120))
    land_area_ha: Mapped[float | None] = mapped_column(Float)
    experience_years: Mapped[int | None] = mapped_column(Integer)
    prefers_voice: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    farms: Mapped[list["Farm"]] = relationship(back_populates="owner")


class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(120))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    area_ha: Mapped[float | None] = mapped_column(Float)
    boundary_geojson: Mapped[dict | None] = mapped_column(JSON)
    soil_type: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner: Mapped[User] = relationship(back_populates="farms")
    crops: Mapped[list["CropCycle"]] = relationship(back_populates="farm")


class CropCycle(Base):
    """One crop grown on one farm in one season."""
    __tablename__ = "crop_cycles"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"))
    crop: Mapped[str] = mapped_column(String(60))
    variety: Mapped[str | None] = mapped_column(String(80))
    sowing_date: Mapped[date | None] = mapped_column(Date)
    growth_stage: Mapped[str | None] = mapped_column(String(60))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    farm: Mapped[Farm] = relationship(back_populates="crops")


class SoilRecord(Base):
    __tablename__ = "soil_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"))
    tested_on: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(80), default="farmer_entry")
    soil_type: Mapped[str | None] = mapped_column(String(60))
    ph: Mapped[float | None] = mapped_column(Float)
    ec: Mapped[float | None] = mapped_column(Float)
    organic_carbon: Mapped[float | None] = mapped_column(Float)
    nitrogen: Mapped[float | None] = mapped_column(Float)
    phosphorus: Mapped[float | None] = mapped_column(Float)
    potassium: Mapped[float | None] = mapped_column(Float)
    sulphur: Mapped[float | None] = mapped_column(Float)
    zinc: Mapped[float | None] = mapped_column(Float)
    iron: Mapped[float | None] = mapped_column(Float)
    manganese: Mapped[float | None] = mapped_column(Float)
    boron: Mapped[float | None] = mapped_column(Float)


class CropImage(Base):
    __tablename__ = "crop_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    crop_cycle_id: Mapped[int] = mapped_column(ForeignKey("crop_cycles.id"))
    view_type: Mapped[str] = mapped_column(String(30))  # whole/top/under/stem/fruit/damage
    file_path: Mapped[str] = mapped_column(String(400))
    quality_score: Mapped[int | None] = mapped_column(Integer)
    quality_issues: Mapped[list | None] = mapped_column(JSON)
    features: Mapped[dict | None] = mapped_column(JSON)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id: Mapped[int] = mapped_column(primary_key=True)
    crop_cycle_id: Mapped[int] = mapped_column(ForeignKey("crop_cycles.id"))
    primary_label: Mapped[str] = mapped_column(String(160))
    differential: Mapped[list] = mapped_column(JSON)     # ranked alternatives
    confidence: Mapped[str] = mapped_column(String(10))  # Low / Medium / High
    severity: Mapped[str] = mapped_column(String(10))    # ok / watch / risk
    evidence: Mapped[list] = mapped_column(JSON)
    actions: Mapped[list] = mapped_column(JSON)
    knowledge_refs: Mapped[list | None] = mapped_column(JSON)
    image_ids: Mapped[list | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"))
    kind: Mapped[str] = mapped_column(String(40))
    level: Mapped[str] = mapped_column(String(10))
    title: Mapped[str] = mapped_column(String(200))
    reason: Mapped[str] = mapped_column(Text)
    action: Mapped[str | None] = mapped_column(String(200))
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(10))
    text: Mapped[str] = mapped_column(Text)
    route: Mapped[str | None] = mapped_column(String(30))
    sources: Mapped[list | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class MonitoringEvent(Base):
    __tablename__ = "monitoring_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    crop_cycle_id: Mapped[int] = mapped_column(ForeignKey("crop_cycles.id"))
    happened_on: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10))
    note: Mapped[str] = mapped_column(Text)
