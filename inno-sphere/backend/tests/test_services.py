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
    assert result["provider"] == "demo-fallback"
    assert result["current"]["temp"] == 30
    assert "not live evidence" in result["note"]


def test_weather_uses_cache(monkeypatch):
    weather._cache.clear()
    calls = 0

    async def get(*args, **kwargs):
        nonlocal calls
        calls += 1
        return type("Response", (), {
            "raise_for_status": lambda self: None,
            "json": lambda self: {
                "current": {"temperature_2m": 25, "relative_humidity_2m": 60,
                             "wind_speed_10m": 5, "weather_code": 0},
                "daily": {"time": ["2026-09-25"], "temperature_2m_max": [30],
                           "temperature_2m_min": [20], "precipitation_probability_max": [0],
                           "relative_humidity_2m_mean": [60]},
            },
        })()

    monkeypatch.setattr(weather.httpx.AsyncClient, "get", get)
    first = asyncio.run(weather.fetch(10.123, 20.456))
    second = asyncio.run(weather.fetch(10.123, 20.456))
    assert first["provider"] == "Open-Meteo"
    assert second["cached"]
    assert calls == 1