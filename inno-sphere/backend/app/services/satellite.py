"""Satellite field intelligence.

Splits the farm boundary into zones and reports a vegetation index per zone so
the farmer knows where to walk. With Copernicus Data Space credentials in .env
this pulls a Sentinel-2 L2A tile and computes the indices for real. Without
credentials it returns the farm's last stored zone readings and marks the
source as unconnected, so the interface can prompt the user to connect rather
than showing values that were never measured.

NDVI = (B08 - B04) / (B08 + B04)   canopy vigour
NDRE = (B08 - B05) / (B08 + B05)   stress before it is visible
NDMI = (B08 - B11) / (B08 + B11)   canopy moisture
"""
from ..config import settings

GRID = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4"]


def connected() -> bool:
    return bool(settings.copernicus_user and settings.copernicus_password)


def classify(ndvi: float) -> str:
    if ndvi >= 0.60:
        return "ok"
    if ndvi >= 0.38:
        return "watch"
    return "risk"


async def field_zones(farm_id: int, stored: list[dict] | None = None) -> dict:
    """Return per-zone condition for a farm.

    `stored` is the most recent set of readings held in the database. Replace
    the branch below with a real Copernicus request when credentials exist:

        token = await _copernicus_token()
        tile  = await _fetch_l2a(bbox, date_range, token)
        zones = _zonal_stats(tile, boundary_geojson)
    """
    if not connected():
        return {
            "source": "not_connected",
            "message": ("Connect a Copernicus Data Space account in settings to pull "
                        "live Sentinel-2 imagery for this farm."),
            "zones": stored or [],
            "series": [],
            "flagged_zones": [z["id"] for z in (stored or []) if z["status"] != "ok"],
        }

    raise NotImplementedError(
        "Copernicus credentials are set. Implement _fetch_l2a() to download the "
        "Sentinel-2 L2A tile for the farm boundary and compute zonal NDVI/NDRE/NDMI."
    )
