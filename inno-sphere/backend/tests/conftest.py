import os

os.environ["DATABASE_URL"] = "sqlite:///./test_innosphere.db"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["ENVIRONMENT"] = "test"
os.environ["FRONTEND_URL"] = "http://testserver"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine, get_db
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(database):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db(database):
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def register(client, name):
    response = client.post("/auth/register", json={
        "name": name, "password": "testpass123", "language": "en",
    })
    assert response.status_code == 200, response.text
    return response.json()["access_token"]