"""Differential diagnosis scoring.

IMPORTANT — read before you ship this.
These are transparent, hand-written rules over measured image features plus
farm context. They are NOT calibrated probabilities from a trained model, and
the UI must say so. When you plug in a real classifier, replace `score()` and
return calibrated probabilities instead, then update the wording in the client.
"""
from dataclasses import dataclass

CANDIDATES = {
    "healthy": "No problem visible",
    "fungal": "Fungal leaf disease",
    "nutrient": "Nutrient deficiency",
    "stress": "Environmental stress",
    "pest": "Pest damage",
}


@dataclass
class Context:
    crop: str
    growth_stage: str
    humid_nights: int = 0
    max_temp: float = 30.0
    soil_zinc: float | None = None
    soil_organic_carbon: float | None = None
    past_problems: tuple[str, ...] = ()
    farmer_note: str = ""
    views: tuple[str, ...] = ()


def score(lesion_pct: float, yellow_share: float, ctx: Context) -> list[dict]:
    # A healthy plant must be able to win. Without this the model is forced to
    # name a problem even when there is nothing wrong, which destroys trust.
    raw = {
        "healthy": max(0.0, 46 - lesion_pct * 9) + (8 if ctx.humid_nights == 0 else 0),
        "fungal": 10 + lesion_pct * 1.9 + (1 - yellow_share) * 22 + ctx.humid_nights * 6,
        "nutrient": 12 + yellow_share * 40
                    + (14 if (ctx.soil_zinc or 1) < 0.6 else 0)
                    + (6 if (ctx.soil_organic_carbon or 1) < 0.6 else 0),
        "stress": 10 + max(0.0, 30 - lesion_pct) * 0.5 + (10 if ctx.max_temp > 32 else 0),
        "pest": 8 + (14 if "under" in ctx.views else 4) + (6 if lesion_pct > 6 else 0),
    }
    note = ctx.farmer_note.lower()
    if any(w in note for w in ("insect", "pest", "caterpillar", "hole", "कीड़ा", "छेद")):
        raw["pest"] += 25
    if any(w in note for w in ("yellow", "पीला", "पीले")):
        raw["nutrient"] += 12
    if "fungal" in ctx.past_problems:
        raw["fungal"] += 8

    total = sum(raw.values()) or 1
    ranked = sorted(
        ({"key": k, "label": CANDIDATES[k], "share": round(v / total * 100)}
         for k, v in raw.items()),
        key=lambda d: -d["share"],
    )
    return ranked


def confidence(views: int, avg_quality: int, ranked: list[dict]) -> str:
    gap = ranked[0]["share"] - ranked[1]["share"]
    if views >= 3 and avg_quality >= 70 and gap >= 15:
        return "High"
    if views >= 2 and avg_quality >= 55 and gap >= 8:
        return "Medium"
    return "Low"


def severity(top_key: str, lesion_pct: float) -> str:
    if top_key == "healthy":
        return "ok"
    if top_key == "fungal" and lesion_pct > 8:
        return "risk"
    return "watch" if lesion_pct > 3 else "ok"


def missing_view(views: tuple[str, ...]) -> str | None:
    """Multi-view loop: what to ask the farmer for next."""
    for need in ("whole", "top", "under", "damage"):
        if need not in views:
            return need
    return None
