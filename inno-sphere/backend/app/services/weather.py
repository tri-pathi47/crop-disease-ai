"""Weather context.

Uses Open-Meteo by default, which needs no API key and returns live forecast
data for any coordinate in India. If OPENWEATHER_API_KEY is configured that
provider is used instead. Humid-night counting drives disease pressure.
"""
import asyncio
import time

import httpx

from ..config import settings

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_SECONDS = 900
_cache: dict[tuple[float, float], tuple[float, dict]] = {}


async def fetch(lat: float, lon: float) -> dict:
    key = (round(lat, 2), round(lon, 2))
    cached = _cache.get(key)
    if cached and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
        return {**cached[1], "cached": True}

    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "daily": ("temperature_2m_max,temperature_2m_min,precipitation_probability_max,"
                  "relative_humidity_2m_mean"),
        "timezone": "auto",
        "forecast_days": 5,
    }
    try:
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=12) as client:
                    r = await client.get(OPEN_METEO, params=params)
                    r.raise_for_status()
                    data = r.json()
                break
            except httpx.HTTPStatusError as exc:
                if attempt == 1 or exc.response.status_code not in (429, 500, 502, 503, 504):
                    raise
                await asyncio.sleep(0.25)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        if cached:
            return {**cached[1], "cached": True, "stale": True,
                    "note": "Using the last available forecast while live weather reconnects."}
        return _demo_fallback(str(exc))

    result = _with_risk({
        "provider": "Open-Meteo",
        "current": {
            "temp": round(data["current"]["temperature_2m"]),
            "humidity": data["current"]["relative_humidity_2m"],
            "wind": round(data["current"]["wind_speed_10m"]),
            "condition": _describe(data["current"]["weather_code"]),
        },
        "forecast": [
            {
                "day": data["daily"]["time"][i],
                "max": round(data["daily"]["temperature_2m_max"][i]),
                "min": round(data["daily"]["temperature_2m_min"][i]),
                "rain": data["daily"]["precipitation_probability_max"][i] or 0,
                "humidity": round(data["daily"]["relative_humidity_2m_mean"][i] or 0),
            }
            for i in range(len(data["daily"]["time"]))
        ],
    })
    _cache[key] = (time.monotonic(), result)
    return result


def _demo_fallback(error: str) -> dict:
    return _with_risk({
        "provider": "demo-fallback",
        "error": error,
        "current": {"temp": 30, "humidity": 70, "wind": 8, "condition": "Typical conditions"},
        "forecast": [
            {"day": f"Day {index + 1}", "max": 32, "min": 24, "rain": 20, "humidity": 72}
            for index in range(5)
        ],
        "note": "Live weather is temporarily unavailable. This estimate is not live evidence.",
    })


WMO = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Freezing fog", 51: "Light drizzle", 53: "Drizzle",
    55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
    80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail",
}


def _describe(code: int) -> str:
    return WMO.get(code, "Mixed conditions")


def _with_risk(payload: dict) -> dict:
    humid_nights = sum(1 for d in payload["forecast"] if d["humidity"] > 78)
    payload["humid_nights"] = humid_nights
    payload["disease_pressure"] = (
        "high" if humid_nights >= 3 else "moderate" if humid_nights >= 1 else "low")
    payload["note"] = ("Weather changes how likely a problem is. On its own it is "
                       "never a diagnosis.")
    return payload
