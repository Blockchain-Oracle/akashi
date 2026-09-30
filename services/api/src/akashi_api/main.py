"""akashi-api: one process serving the three Pocket services under /cite, /code and /now."""

from fastapi import Response

from akashi_api.lifespan import lifespan
from akashi_api.schemas import SPECS as SCHEMA_SPECS
from akashi_cite.router import router as cite_router
from akashi_code.router import router as code_router
from akashi_core.app.factory import ServiceSpec, create_root_app
from akashi_core.app.handlers import error_response
from akashi_core.constants.app import (
    PREFIX_CITE,
    PREFIX_CODE,
    PREFIX_NOW,
    SERVICE_CITE,
    SERVICE_CODE,
    SERVICE_NOW,
)
from akashi_core.constants.deadlines import CITE_DEADLINE_S, CODE_DEADLINE_S, NOW_DEADLINE_S
from akashi_core.constants.http import HTTP_NOT_FOUND
from akashi_core.contract.enums import ErrorCode
from akashi_core.schema.cli import openapi_document, render
from akashi_now.router import router as now_router

SPECS = [
    ServiceSpec(SERVICE_CITE, PREFIX_CITE, "Akashi Citation Verifier", CITE_DEADLINE_S, cite_router),
    ServiceSpec(SERVICE_CODE, PREFIX_CODE, "Akashi Code Reality Check", CODE_DEADLINE_S, code_router),
    ServiceSpec(SERVICE_NOW, PREFIX_NOW, "Akashi Live Facts", NOW_DEADLINE_S, now_router),
]

app = create_root_app(SPECS, lifespan=lifespan)

# Card `specs[].url` targets (audit A8): rendered once from the running routers,
# byte-identical to cards/<id>/openapi.json.
SPEC_FILE_SUFFIX = ".openapi.json"
_SPEC_BODIES = {f"{s.service_id}{SPEC_FILE_SUFFIX}": render(openapi_document(s)) for s in SCHEMA_SPECS}


@app.get("/specs/{name}", include_in_schema=False)
async def service_spec(name: str) -> Response:
    body = _SPEC_BODIES.get(name)
    if body is None:
        message = f"no spec named {name!r}"
        return error_response(HTTP_NOT_FOUND, ErrorCode.not_found, message, details=sorted(_SPEC_BODIES))
    return Response(body, media_type="application/json")
