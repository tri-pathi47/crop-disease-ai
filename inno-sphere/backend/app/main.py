from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .services import storage
from .routers import auth, farm, images, diagnosis, context, chat, knowledge


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    yield

app = FastAPI(
    title=settings.app_name,
    version="0.3.0",
    lifespan=lifespan,
    description=(
        "Crop health and farm intelligence for Indian farmers.\n\n"
        "Pipeline: CAPTURE -> ANALYZE -> VERIFY -> EXPLAIN -> ADVISE -> MONITOR.\n"
        "No diagnosis is returned without evidence, and confidence is always stated."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://inno-sphere-web.onrender.com",
        *([settings.frontend_url.rstrip("/")] if settings.frontend_url else []),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, farm.router, images.router, diagnosis.router,
          context.router, chat.router, knowledge.router):
    app.include_router(r)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "environment": settings.environment,
        "image_storage": "cloudinary" if storage.configured() else "local-temporary",
    }
