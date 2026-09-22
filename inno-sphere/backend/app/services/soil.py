"""Regional soil estimates from ISRIC SoilGrids.

These values are modeled regional estimates, not a replacement for a soil
health card or laboratory test. The response keeps that distinction explicit.
"""
import httpx

SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPERTIES = {
    "phh2o": ("ph", 10),
    "soc": ("organic_carbon", 10),
    "nitrogen": ("nitrogen", 100),
    "clay": ("clay", 10),
    "sand": ("sand", 10),
}


async def estimate(lat: float, lon: float) -> dict:
    params = [("lat", lat), ("lon", lon), ("depth", "0-5cm"), ("value", "mean")]
    params.extend(("property", name) for name in PROPERTIES)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(SOILGRIDS_URL, params=params)
            response.raise_for_status()
            data = response.json()
        values = {}
        for layer in data.get("properties", {}).get("layers", []):
            property_name = layer.get("name")
            target = PROPERTIES.get(property_name)
            mean = (layer.get("depths") or [{}])[0].get("values", {}).get("mean")
            if target and mean is not None and mean >= 0:
                values[target[0]] = round(mean / target[1], 2)
        return {
            "source": "ISRIC SoilGrids",
            "source_url": "https://soilgrids.org",
            "confidence": "regional estimate",
            "depth": "0-5 cm",
            "latitude": lat,
            "longitude": lon,
            "values": values,
            "note": "Use a Soil Health Card or laboratory test for field decisions. These values are modeled regional estimates.",
        }
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        return {
            "source": "unavailable",
            "confidence": "none",
            "values": {},
            "error": str(exc),
            "note": "The regional soil service is unavailable. Enter measured values from a Soil Health Card or laboratory test.",
        }