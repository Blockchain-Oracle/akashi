"""HTTP surface: POST /score (premise/hypothesis pairs → label probabilities), GET /health. Internal only."""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from akashi_core.app.handlers import install_handlers
from akashi_core.obs.logging import configure_logging
from akashi_core.settings import get_settings
from akashi_nli.constants import MAX_PAIRS, MAX_TEXT_CHARS, MODEL_ID
from akashi_nli.model import NliModel

model = NliModel(Path(get_settings().nli_model_dir))


class Pair(BaseModel):
    premise: str = Field(min_length=1, max_length=MAX_TEXT_CHARS)
    hypothesis: str = Field(min_length=1, max_length=MAX_TEXT_CHARS)


class ScoreRequest(BaseModel):
    pairs: list[Pair] = Field(min_length=1, max_length=MAX_PAIRS)


class ScoreResponse(BaseModel):
    model: str
    scores: list[dict[str, float]]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging(get_settings().log_level)
    reaper = asyncio.create_task(model.unload_when_idle())
    yield
    reaper.cancel()


app = FastAPI(title="akashi-nli", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
install_handlers(app)


@app.get("/health")
async def health() -> dict[str, object]:
    return {"status": "ok", "loaded": model.loaded}


@app.post("/warm")
async def warm() -> dict[str, object]:
    """Start loading without waiting: /claim calls this first so the load overlaps its evidence fetching."""
    if not model.loaded:
        model.spawn_load()
    return {"status": "ok", "loaded": model.loaded}


@app.post("/score")
async def score(body: ScoreRequest) -> ScoreResponse:
    scores = await model.score([(p.premise, p.hypothesis) for p in body.pairs])
    return ScoreResponse(model=MODEL_ID, scores=scores)
