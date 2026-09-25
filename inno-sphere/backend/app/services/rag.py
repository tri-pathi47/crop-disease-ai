"""Retrieval-augmented answering.

This module is the seam where the real stack plugs in. The current
implementation is keyword retrieval over the curated knowledge base, which is
enough to run the product end to end and keeps every answer traceable.

TO GO FULL RAG:
  1. Embed knowledge chunks (sentence-transformers) into pgvector.
  2. Replace `retrieve()` with vector search + metadata filters
     (crop, region, growth stage).
  3. Feed the retrieved chunks plus farm context to your LLM in
     `generate()`, and keep returning the same `sources` list.
  4. Optionally add Neo4j traversal (crop -> disease -> symptom) to expand
     the candidate set before ranking.
"""
from . import knowledge

SOURCES = [
    {"name": "ICAR", "detail": "Crop protection and IPM package of practices",
     "url": "https://icar.org.in"},
    {"name": "FAO", "detail": "Plant health and diagnostic methodology",
     "url": "https://www.fao.org/plant-health"},
    {"name": "IMD", "detail": "Weather observation and forecast",
     "url": "https://mausam.imd.gov.in"},
    {"name": "Copernicus Sentinel-2", "detail": "Multispectral field monitoring",
     "url": "https://dataspace.copernicus.eu"},
    {"name": "ISRO Bhuvan", "detail": "Earth observation and field mapping",
     "url": "https://bhuvan.nrsc.gov.in"},
]


ROUTE_WORDS = {
    # Farmers type Indian languages in both native script and Latin letters, so
    # both spellings have to match.
    "farm_satellite": ("field", "zone", "satellite", "खेत", "khet", "kheti", "shet"),
    "weather": ("weather", "rain", "humid", "मौसम", "बारिश", "mausam", "barish", "paus"),
    "soil": ("soil", " ph", "zinc", "nutrient", "मिट्टी", "mitti", "matti", "khad"),
    "external": ("icar", "research", "latest", "guidance", "advisory", "kvk"),
    "pest": ("pest", "insect", "aphid", "whitefly", "caterpillar", "कीट", "कीड़ा",
             "keeda", "kida", "mava", "sundi"),
}


def route(question: str) -> str:
    """Decide which evidence the question actually needs."""
    q = f" {question.lower()} "
    for kind, words in ROUTE_WORDS.items():
        if any(w in q for w in words):
            return kind
    return "knowledge"


def retrieve(question: str, crop: str, top_k: int = 3) -> list[dict]:
    words = {w for w in question.lower().split() if len(w) > 3}
    pool = knowledge.diseases_for(crop) + knowledge.pests_for(crop)
    scored = []
    for item in pool:
        blob = " ".join(str(v) for v in item.values()).lower()
        scored.append((sum(1 for w in words if w in blob), item))
    scored.sort(key=lambda t: -t[0])
    return [item for hits, item in scored[:top_k] if hits]


def generate(question: str, crop: str, context: dict) -> dict:
    """Assemble an answer from retrieved knowledge plus live farm context."""
    kind = route(question)
    chunks = retrieve(question, crop)
    return {
        "route": kind,
        "retrieved": [c.get("name") for c in chunks],
        "context_used": sorted(context.keys()),
        "sources": SOURCES,
        "answer": _compose(kind, chunks, context),
    }


def _compose(kind: str, chunks: list[dict], ctx: dict) -> str:
    if kind == "soil" and ctx.get("soil"):
        s = ctx["soil"]
        return (f"Your soil is {s.get('soil_type')} at pH {s.get('ph')}. "
                f"Zinc at {s.get('zinc')} ppm and organic carbon at "
                f"{s.get('organic_carbon')}% are the two values worth watching. "
                "A zinc shortage shows as pale bands between the veins of young "
                "leaves, which looks quite different from the ringed brown spots "
                "of a fungal disease on older leaves.")
    if kind == "weather" and ctx.get("weather"):
        w = ctx["weather"]
        return (f"Humidity is around {w.get('humidity')}% and the forecast has "
                f"{w.get('humid_nights', 0)} humid nights ahead. That raises the "
                "chance of fungal leaf disease — it does not mean you have one. "
                "This is the week to look closely at the lower leaves.")
    if chunks:
        c = chunks[0]
        return (f"{c['name']}: {c.get('symptoms') or c.get('damage')}. "
                f"It is favoured by {c.get('favours') or c.get('season')}. "
                "Send a photo of the whole plant and one of the underside of an "
                "affected leaf so this can be narrowed down instead of guessed.")
    profile = knowledge.entry("crops", crop_name(ctx).lower().strip())
    if profile:
        return (f"For {profile['name']} at the {ctx.get('stage', 'current')} stage: "
                f"this crop prefers {profile['soil']}. "
                f"Key nutrient guidance: {profile['nutrients']}. "
                f"Watch the weather because {profile['climate']}. "
                "Use your soil test and a clear whole-plant photo before making a treatment decision.")
    return (f"For {crop_name(ctx)}, the photo and description do not yet match a verified crop-specific knowledge entry. "
            "Yellow leaves have at least four common explanations: a fungal "
            "disease, a nutrient shortage, water or heat stress, and insect "
            "feeding. They are separated by where the yellowing starts, its "
            "pattern, and what the weather has been doing. A photo of the whole "
            "plant, the leaf underside, and the crop growth stage would let me narrow it down safely.")


def crop_name(ctx: dict) -> str:
    crop = ctx.get("crop")
    if isinstance(crop, dict):
        crop = crop.get("crop")
    return crop or "this crop"
