from urllib.parse import urlsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings



def normalize_database_url(database_url: str) -> str:
    """Make Render/Neon PostgreSQL URLs use the installed psycopg driver."""
    normalized = database_url.strip().strip('"\'')
    if normalized.startswith("postgres://"):
        normalized = "postgresql://" + normalized.removeprefix("postgres://")
    if normalized.startswith("postgresql://"):
        normalized = "postgresql+psycopg://" + normalized.removeprefix("postgresql://")
    elif normalized.startswith("postgresql+psycopg2://"):
        normalized = "postgresql+psycopg://" + normalized.removeprefix("postgresql+psycopg2://")
    parsed = urlsplit(normalized)
    if parsed.scheme != "postgresql+psycopg" or not parsed.hostname:
        raise ValueError(
            "DATABASE_URL must be a complete Neon PostgreSQL URL, for example "
            "postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require"
        )
    if parsed.hostname in {"db", "HOST", "host"} or "<" in parsed.hostname:
        raise ValueError(
            "DATABASE_URL still points to a local/placeholder host. Copy the Neon "
            "connection string into Render's DATABASE_URL environment variable."
        )
    return normalized


engine = create_engine(
    normalize_database_url(settings.database_url),
    pool_pre_ping=True,
    pool_recycle=300,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
