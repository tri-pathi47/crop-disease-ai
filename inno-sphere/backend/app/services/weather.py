"""Weather context.

Uses Open-Meteo by default, which needs no API key and returns live forecast
data for any coordinate in India. If OPENWEATHER_API_KEY is configured that
provider is used instead. Humid-night counting drives disease pressure.
"""
import httpx

from ..config import settings

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"


async def fetch(lat: float, lon: float) -> dict:
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
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.get(OPEN_METEO, params=params)
            r.raise_for_status()
            data = r.json()
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        # Weather is context, not the core function. A diagnosis must still be
        # possible when the forecast is unreachable — it just loses one piece of
        # supporting evidence, and says so.
        return {
            "provider": "unavailable",
            "error": str(exc),
            "current": None,
            "forecast": [],
            "humid_nights": 0,
            "disease_pressure": "unknown",
            "note": "Weather could not be loaded, so it was not used as evidence.",
        }

    cur, daily = data["current"], data["daily"]
    forecast = [
        {
            "day": daily["time"][i],
            "max": round(daily["temperature_2m_max"][i]),
            "min": round(daily["temperature_2m_min"][i]),
            "rain": daily["precipitation_probability_max"][i] or 0,
            "humidity": round(daily["relative_humidity_2m_mean"][i] or 0),
        }
        for i in range(len(daily["time"]))
    ]

    return _with_risk({
        "provider": "Open-Meteo",
        "current": {
            "temp": round(cur["temperature_2m"]),
            "humidity": cur["relative_humidity_2m"],
            "wind": round(cur["wind_speed_10m"]),
            "condition": _describe(cur["weather_code"]),
        },
        "forecast": forecast,
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
