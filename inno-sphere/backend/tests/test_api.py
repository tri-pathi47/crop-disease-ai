from conftest import register


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_health_is_public(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_login_and_profile(client):
    token = register(client, "Test Farmer")
    me = client.get("/auth/me", headers=auth(token))
    assert me.status_code == 200
    assert me.json()["name"] == "Test Farmer"

    login = client.post("/auth/login", json={
        "name": "Test Farmer", "password": "testpass123",
    })
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_farm_crop_persistence_and_ownership(client):
    owner = register(client, "Owner Farmer")
    outsider = register(client, "Other Farmer")

    farm = client.post("/farms", headers=auth(owner), json={
        "name": "North Field", "latitude": 28.6, "longitude": 77.4,
        "area_ha": 1.5,
    })
    assert farm.status_code == 200
    farm_id = farm.json()["id"]

    crop = client.post("/crops", headers=auth(owner), json={
        "farm_id": farm_id, "crop": "okra", "growth_stage": "Flowering",
    })
    assert crop.status_code == 200
    crop_id = crop.json()["id"]

    assert client.get(f"/crops?farm_id={farm_id}", headers=auth(outsider)).status_code == 404
    assert client.get(f"/soil/{farm_id}", headers=auth(outsider)).status_code == 404
    assert client.put(f"/crops/{crop_id}", headers=auth(outsider), json={
        "farm_id": farm_id, "crop": "wheat", "growth_stage": "Heading",
    }).status_code == 404


def test_profile_update_is_persisted(client):
    token = register(client, "Profile Farmer")
    response = client.put("/auth/me", headers=auth(token), json={
        "district": "Ghaziabad", "village": "Test Village", "land_area_ha": 2.2,
    })
    assert response.status_code == 200
    assert response.json()["district"] == "Ghaziabad"


def test_unconnected_satellite_is_explicit(client):
    token = register(client, "Map Farmer")
    farm = client.post("/farms", headers=auth(token), json={"name": "Map Field"})
    result = client.get(f"/satellite/{farm.json()['id']}", headers=auth(token))
    assert result.status_code == 200
    assert result.json()["source"] in {"not_connected", "unavailable"}