from fastapi import APIRouter, HTTPException

from ..services import knowledge as kb

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/crops")
def crops():
    return kb.kb()["crops"]


@router.get("/diseases")
def diseases(crop: str | None = None):
    return kb.diseases_for(crop) if crop else list(kb.kb()["diseases"].values())


@router.get("/pests")
def pests(crop: str | None = None):
    return kb.pests_for(crop) if crop else list(kb.kb()["pests"].values())


@router.get("/glossary")
def glossary():
    return kb.kb()["glossary"]


@router.get("/entry/{kind}/{key}")
def entry(kind: str, key: str):
    found = kb.entry(kind, key)
    if not found:
        raise HTTPException(404, "No knowledge entry with that key.")
    return found
