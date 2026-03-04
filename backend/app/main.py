from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import close_pool, create_pool
from app.routers import query

def _find_version() -> str:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "VERSION"
        if candidate.is_file():
            return candidate.read_text().strip()
    return "0.0.0"

__version__ = _find_version()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.pool = await create_pool(settings)
    yield
    await close_pool(app.state.pool)


app = FastAPI(title="AskDB", version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
