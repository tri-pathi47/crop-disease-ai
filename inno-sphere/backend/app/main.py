from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, farm, images, diagnosis, context, chat, knowledge

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    description=(
        "Crop health and farm intelligence for Indian farmers.\n\n"
        "Pipeline: CAPTURE -> ANALYZE -> VERIFY -> EXPLAIN -> ADVISE -> MONITOR.\n"
        "No diagnosis is returned without evidence, and confidence is always stated."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, farm.router, images.router, diagnosis.router,
          context.router, chat.router, knowledge.router):
    app.include_router(r)


@app.on_event("startup")
def startup():
    # For a real deployment use Alembic migrations instead.
    Base.metadata.create_all(engine)


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}
