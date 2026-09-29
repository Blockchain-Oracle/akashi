"""akashi-api: one process serving the three Pocket services under /cite, /code and /now."""

from fastapi import APIRouter

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

# Domain routers replace these empty ones in S3–S5.
SPECS = [
    ServiceSpec(SERVICE_CITE, PREFIX_CITE, "Akashi Citation Verifier", CITE_DEADLINE_S, APIRouter()),
    ServiceSpec(SERVICE_CODE, PREFIX_CODE, "Akashi Code Reality Check", CODE_DEADLINE_S, APIRouter()),
    ServiceSpec(SERVICE_NOW, PREFIX_NOW, "Akashi Live Facts", NOW_DEADLINE_S, APIRouter()),
]

app = create_root_app(SPECS)
