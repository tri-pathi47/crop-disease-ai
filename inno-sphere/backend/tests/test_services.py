import asyncio

import cv2
import numpy as np

from app.services import image_quality, knowledge, rag, scoring, weather


def test_image_quality_rejects_dark_nonplant_photo():
    image = np.zeros((800, 800, 3), dtype=np.uint8)
    result = image_quality.assess(image)
    assert not result.usable
    assert "too_dark" in result.issues
    assert "plant_not_visible" in result.issues


def test_image_quality_accepts_clear_green_image():
    image = np.zeros((800, 800, 3), dtype=np.uint8)
    image[:] = (40, 120, 40)
    cv2.rectangle(image, (150, 150), (650, 650), (45, 180, 45), -1)
    result = image_quality.assess(image)
    assert result.usable
    assert result.score >= 55


def test_healthy_result_has_no_disease_reference():
    assert knowledge.best_match("tomato", "healthy", 0, 0) is None


def test_expanded_crop_profile_is_available_to_assistant():
    assert knowledge.entry("crops", "rice")["soil"]
    answer = rag.generate("What soil does my crop need?", "rice", {
        "crop": {"crop": "rice", "stage": "Tillering"},
    })
    assert "Rice" in answer["answer"]
    assert "soil" in answer["answer"].lower()


def test_scoring_returns_ranked_candidates():
    context = scoring.Context(crop="okra", growth_stage="Flowering", views=("whole", "top"))
    ranked = scoring.score(2, 0.2, context)
    assert ranked
    assert ranked[0]["share"] >= ranked[-1]["share"]
    assert sum(item["share"] for item in ranked) in range(95, 106)


def test_weather_fallback_is_safe(monkeypatch):
    async def fail(*args, **kwargs):
        raise weather.httpx.ConnectError("offline")

    monkeypatch.setattr(weather.httpx.AsyncClient, "__aenter__", fail)
    result = asyncio.run(weather.fetch(28.6, 77.4))
    assert result["provider"] == "unavailable"
    assert result["current"] is None