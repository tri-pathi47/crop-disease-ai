"""Multi-view diagnosis: PREDICT -> DETECT -> VERIFY -> EXPLAIN -> ADVISE."""
import cv2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CropImage, CropCycle, Diagnosis, SoilRecord, User
from ..schemas import AnalyseIn, DiagnosisOut
from ..services import segmentation, scoring, knowledge, rag, weather, satellite
from .auth import current_user

router = APIRouter(prefix="/diagnosis", tags=["diagnosis"])

PLAIN = {
    "healthy": {
        "en": "Nothing on these photos looks like a disease or pest problem. The leaf "
              "colour is in the healthy range. Keep checking every few days.",
        "hi": "इन तस्वीरों में बीमारी या कीट जैसी कोई समस्या नहीं दिख रही है। पत्तियों का रंग "
              "सामान्य है। हर कुछ दिन में जांच करते रहें।",
    },
    "fungal": {
        "en": "The spots and browning on your leaves match a fungal leaf disease. "
              "The recent humid nights are exactly the weather this disease needs.",
        "hi": "पत्तियों में फफूंद जैसी बीमारी के लक्षण दिख रहे हैं। पिछली कुछ नम रातें "
              "इस बीमारी के लिए अनुकूल हैं।",
    },
    "nutrient": {
        "en": "The yellowing pattern looks more like a nutrient shortage than a "
              "disease. Check your latest soil test before buying anything.",
        "hi": "पीलापन बीमारी से ज़्यादा पोषक तत्व की कमी जैसा लग रहा है। कुछ भी खरीदने "
              "से पहले मिट्टी जांच देखें।",
    },
    "stress": {
        "en": "The plant looks stressed rather than diseased. Heat, transplant shock "
              "or root disturbance can all look like this.",
        "hi": "पौधा बीमार से ज़्यादा तनाव में दिख रहा है। गर्मी या जड़ की गड़बड़ी से ऐसा हो सकता है।",
    },
    "pest": {
        "en": "The damage pattern suggests insects feeding on the plant. Check the "
              "leaf underside for small insects or eggs.",
        "hi": "नुकसान कीट के हमले जैसा लगता है। पत्ते के नीचे छोटे कीड़े या अंडे देखें।",
    },
}

NEXT_PHOTO = {
    "whole": "Please send one photo of the whole plant.",
    "top": "Please send a photo of the top side of an affected leaf.",
    "under": "I need one more photo. Please upload the underside of the affected leaf.",
    "damage": "Please send a close-up of the damaged area.",
}

ACTIONS = {
    "healthy": [
        "No action is needed from these photos.",
        "Keep watching the lower leaves, since most problems start there.",
    ],
    "fungal": [
        "Walk the field and check the lower leaves of ten plants at five different spots.",
        "Remove badly affected lower leaves and take them out of the field instead of "
        "dropping them between rows.",
        "Avoid wetting the leaves while watering, and water early so the canopy dries.",
    ],
    "nutrient": [
        "Compare the yellowing on young leaves with older leaves — the difference tells "
        "you which nutrient is short.",
        "Take your soil health card to the nearest KVK before buying any nutrient product.",
    ],
    "pest": [
        "Turn over ten leaves and count insects or eggs on the underside.",
        "Look for ladybird beetles first — if they are present, the pest may already be "
        "under control.",
    ],
    "stress": [
        "Check whether affected plants sit in one patch of the field or are spread out.",
        "Watch the plants for two days; stress often recovers once the weather turns.",
    ],
}


@router.post("/analyse", response_model=DiagnosisOut)
async def analyse(body: AnalyseIn, db: Session = Depends(get_db),
                  user: User = Depends(current_user)):
    cycle = db.get(CropCycle, body.crop_cycle_id)
    if not cycle or cycle.farm.user_id != user.id:
        raise HTTPException(404, "Crop cycle not found.")

    images = db.query(CropImage).filter(CropImage.id.in_(body.image_ids)).all()
    usable = [i for i in images
              if i.crop_cycle_id == cycle.id and (i.quality_score or 0) >= 55]
    if not usable:
        raise HTTPException(422, "No usable photo. Retake in better light with the "
                                 "affected area clearly visible.")

    # --- DETECT: measure symptoms from the real pixels -----------------
    segs = []
    for row in usable:
        img = cv2.imread(row.file_path)
        if img is not None:
            segs.append(segmentation.segment(img))
    if not segs:
        raise HTTPException(422, "The uploaded photos could not be processed. Please retake them.")
    lesion_pct = sum(s["lesion_pct"] for s in segs) / len(segs)
    yellow_share = sum(s["yellow_share"] for s in segs) / len(segs)

    # --- VERIFY: pull the surrounding context --------------------------
    wx = await weather.fetch(cycle.farm.latitude or 28.6, cycle.farm.longitude or 77.4)
    soil = (db.query(SoilRecord).filter_by(farm_id=cycle.farm_id)
            .order_by(SoilRecord.tested_on.desc()).first())
    sat = await satellite.field_zones(cycle.farm_id)
    views = tuple(i.view_type for i in usable)

    ctx = scoring.Context(
        crop=cycle.crop, growth_stage=cycle.growth_stage or "",
        humid_nights=wx.get("humid_nights", 0),
        max_temp=max((d["max"] for d in wx["forecast"]), default=30.0),
        soil_zinc=getattr(soil, "zinc", None),
        soil_organic_carbon=getattr(soil, "organic_carbon", None),
        farmer_note=body.farmer_note, views=views,
    )

    ranked = scoring.score(lesion_pct, yellow_share, ctx)
    avg_quality = round(sum(i.quality_score for i in usable) / len(usable))
    conf = scoring.confidence(len(usable), avg_quality, ranked)
    sev = scoring.severity(ranked[0]["key"], lesion_pct)
    entry = knowledge.best_match(cycle.crop, ranked[0]["key"], lesion_pct,
                                 ctx.humid_nights)

    missing = scoring.missing_view(views)
    needs_more = conf == "Low" or missing is not None

    actions = list(ACTIONS[ranked[0]["key"]])
    if needs_more and missing:
        actions.insert(0, NEXT_PHOTO[missing])
    actions.append("Photograph the same plants again in two days so changes can be "
                   "compared.")

    evidence = [
        {"ok": True, "key": "Photos checked",
         "value": f"{len(usable)} usable, average quality {avg_quality}/100"},
        {"ok": len(usable) >= 3, "key": "Multiple views compared",
         "value": ", ".join(views)},
        {"ok": True, "key": "Crop and growth stage",
         "value": f"{cycle.crop}, {cycle.growth_stage}"},
        {"ok": wx["provider"] != "unavailable", "key": "Weather match",
         "value": (f"{ctx.humid_nights} humid nights ahead"
                   if wx["provider"] != "unavailable" else "forecast unavailable")},
        {"ok": soil is not None, "key": "Soil record",
         "value": f"pH {soil.ph}, zinc {soil.zinc} ppm" if soil else "not provided"},
        {"ok": sat.get("source") not in ("not_connected", "unavailable"), "key": "Satellite field trend",
         "value": (f"{len(sat['flagged_zones'])} zones flagged"
               if sat.get("source") not in ("not_connected", "unavailable")
               else "satellite provider not connected")},
        {"ok": bool(body.farmer_note), "key": "Your own description",
         "value": "included" if body.farmer_note else "not given"},
    ]

    saved = Diagnosis(
        crop_cycle_id=cycle.id, primary_label=ranked[0]["label"], differential=ranked,
        confidence=conf, severity=sev, evidence=evidence, actions=actions,
        knowledge_refs=[entry["name"]] if entry else [],
        image_ids=[i.id for i in usable],
    )
    db.add(saved)
    db.commit()

    return DiagnosisOut(
        id=saved.id,
        primary=(f"{ranked[0]['label']}, most likely {entry['name']}"
                 if entry else ranked[0]["label"]),
        plain_language=PLAIN[ranked[0]["key"]],
        differential=ranked, confidence=conf, severity=sev,
        evidence=evidence, actions=actions,
        needs_more_evidence=needs_more,
        next_photo_request=NEXT_PHOTO[missing] if missing else None,
        sources=rag.SOURCES,
    )


@router.get("/history/{crop_cycle_id}")
def history(crop_cycle_id: int, db: Session = Depends(get_db),
            user: User = Depends(current_user)):
    cycle = db.get(CropCycle, crop_cycle_id)
    if not cycle or cycle.farm.user_id != user.id:
        raise HTTPException(404, "Crop cycle not found.")
    rows = (db.query(Diagnosis).filter_by(crop_cycle_id=crop_cycle_id)
            .order_by(Diagnosis.created_at.desc()).all())
    return [{"id": r.id, "date": r.created_at, "finding": r.primary_label,
             "confidence": r.confidence, "severity": r.severity} for r in rows]
