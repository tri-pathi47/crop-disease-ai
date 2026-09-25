"""Chat, smart search routing and the voice pipeline."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ChatMessage, CropCycle, SoilRecord, User
from ..schemas import ChatIn
from ..services import rag, weather as weather_service
from .auth import current_user

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(body: ChatIn, db: Session = Depends(get_db),
               user: User = Depends(current_user)):
    crop = "your crop"
    cycle = None
    context: dict = {"language": body.language}

    if body.crop_cycle_id:
        cycle = db.get(CropCycle, body.crop_cycle_id)
        if cycle and cycle.farm.user_id == user.id:
            crop = cycle.crop
            context["crop"] = {"crop": cycle.crop, "stage": cycle.growth_stage}
            soil = (db.query(SoilRecord).filter_by(farm_id=cycle.farm_id)
                    .order_by(SoilRecord.tested_on.desc()).first())
            if soil:
                context["soil"] = {
                    "soil_type": soil.soil_type, "ph": soil.ph,
                    "zinc": soil.zinc, "organic_carbon": soil.organic_carbon}

    route = rag.route(body.question)
    if route in ("weather", "farm_satellite"):
        farm = cycle.farm if cycle else None
        context["weather"] = await weather_service.fetch(
            farm.latitude if farm and farm.latitude is not None else 28.669,
            farm.longitude if farm and farm.longitude is not None else 77.453,
        )

    result = rag.generate(body.question, crop, context)

    db.add(ChatMessage(user_id=user.id, role="user", text=body.question))
    db.add(ChatMessage(user_id=user.id, role="assistant", text=result["answer"],
                       route=result["route"], sources=result["sources"]))
    db.commit()
    return result


@router.get("/chat/history")
def history(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = (db.query(ChatMessage).filter_by(user_id=user.id)
            .order_by(ChatMessage.created_at).all())
    return [{"role": r.role, "text": r.text, "sources": r.sources} for r in rows]


@router.post("/voice/transcribe")
async def transcribe():
    """Speech to text.

    Wire this to a Bhashini-compatible ASR endpoint. Keep the response shape:
    {"text": ..., "language": ...} so the client does not need to change.
    """
    return {"text": "", "language": "hi",
            "note": "Connect a Bhashini ASR endpoint. Set BHASHINI_API_KEY in .env."}


@router.post("/voice/speak")
async def speak():
    """Text to speech. Returns audio in production; stub here."""
    return {"audio_url": None,
            "note": "Connect a Bhashini TTS endpoint. The web client falls back to "
                    "the browser speechSynthesis API."}
