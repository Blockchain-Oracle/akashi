"""akashi-api: one process serving the three Pocket services under /cite, /code and /now."""

from akashi_api.lifespan import lifespan
from akashi_cite.router import router as cite_router
from akashi_code.router import router as code_router
from akashi_core.app.factory import ServiceSpec, create_root_app
from akashi_core.constants.app import (
    PREFIX_CITE,
    PREFIX_CODE,
    PREFIX_NOW,
    SERVICE_CITE,
    SERVICE_CODE,
    SERVICE_NOW,
)
from akashi_core.constants.deadlines import CITE_DEADLINE_S, CODE_DEADLINE_S, NOW_DEADLINE_S
from akashi_now.router import router as now_router

SPECS = [
    ServiceSpec(SERVICE_CITE, PREFIX_CITE, "Akashi Citation Verifier", CITE_DEADLINE_S, cite_router),
    ServiceSpec(SERVICE_CODE, PREFIX_CODE, "Akashi Code Reality Check", CODE_DEADLINE_S, code_router),
    ServiceSpec(SERVICE_NOW, PREFIX_NOW, "Akashi Live Facts", NOW_DEADLINE_S, now_router),
]

app = create_root_app(SPECS, lifespan=lifespan)
