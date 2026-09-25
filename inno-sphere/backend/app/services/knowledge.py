"""Knowledge base access.

Loads the curated agricultural knowledge from app/data/knowledge.json. Every
entry carries a source and a version so an answer can be traced back.
"""
import json
from functools import lru_cache
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data" / "knowledge.json"


@lru_cache
def kb() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def diseases_for(crop: str) -> list[dict]:
    return [d for d in kb()["diseases"].values() if crop.lower() in d["crops"]]


def pests_for(crop: str) -> list[dict]:
    return [p for p in kb()["pests"].values() if crop.lower() in p["crops"]]


def entry(kind: str, key: str) -> dict | None:
    return kb().get(kind, {}).get(key)


def best_match(crop: str, key: str, lesion_pct: float, humid_nights: int) -> dict | None:
    """Pick the knowledge entry that best explains the measured evidence."""
    if key in ("healthy", "nutrient", "stress"):
        return None
    if key == "pest":
        candidates = pests_for(crop)
        return candidates[0] if candidates else None
    candidates = diseases_for(crop)
    if not candidates:
        return None
    if humid_nights >= 3:
        for d in candidates:
            if "humid" in d["favours"].lower() or "wet" in d["favours"].lower():
                return d
    return candidates[0]


def glossary(term: str) -> dict | None:
    """Map a local farmer word to a verified standard term."""
    for row in kb()["glossary"]:
        if row["local"].lower() == term.lower().strip():
            return row if row["status"] == "verified" else None
    return None
