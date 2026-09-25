"""Application settings. Everything is read from the environment (.env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inno Sphere API"
    environment: str = "development"

    database_url: str = "sqlite:///./innosphere.db"
    frontend_url: str = ""

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 14

    upload_dir: str = "./uploads"
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None

    # Optional external services. When a key is missing the matching service
    # falls back to clearly-labelled demo data instead of failing.
    openweather_api_key: str | None = None
    imd_api_key: str | None = None
    copernicus_user: str | None = None
    copernicus_password: str | None = None
    bhashini_api_key: str | None = None
    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
