"""`akashi-schemas`: write cards/<service-id>/{output-schema,input-schema,openapi}.json from the live models.

Each service registers (service_id, result models, request models, router, example) in `SERVICES` via the api
package, so this module stays independent of the domain packages.
"""

import json
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel

from akashi_core.app.probes import probe_router
from akashi_core.constants.http import HTTP_BAD_REQUEST, HTTP_PAYLOAD_TOO_LARGE, HTTP_UNPROCESSABLE
from akashi_core.contract.envelope import ErrorEnvelope
from akashi_core.schema.generate import JSON_SCHEMA_DIALECT, model_schema, output_schema


@dataclass(frozen=True, slots=True)
class SchemaSpec:
    service_id: str
    title: str
    results: list[type[BaseModel]]
    requests: list[type[BaseModel]]
    router: APIRouter
    example: dict[str, Any] | None = None


def _input_schema(requests: list[type[BaseModel]]) -> dict[str, Any]:
    return {"$schema": JSON_SCHEMA_DIALECT, "anyOf": [model_schema(r) for r in requests]}


# What the handlers in akashi_core.app.handlers actually send; replaces FastAPI's default HTTPValidationError.
ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    HTTP_BAD_REQUEST: {"model": ErrorEnvelope, "description": "Body is not valid JSON."},
    HTTP_PAYLOAD_TOO_LARGE: {"model": ErrorEnvelope, "description": "Body over the size limit."},
    HTTP_UNPROCESSABLE: {"model": ErrorEnvelope, "description": "Valid JSON that fails validation."},
}


def openapi_document(spec: SchemaSpec) -> dict[str, Any]:
    app = FastAPI(title=spec.title, version="1.0.0", openapi_url="/openapi.json")
    app.include_router(probe_router(spec.service_id))
    app.include_router(spec.router, responses=ERROR_RESPONSES)
    return app.openapi()  # paths are prefix-free (/v1/...), as gateways and the portal call them


def render(doc: dict[str, Any]) -> bytes:
    """The exact bytes written to cards/ and served at /specs/, so a pinned sha256 matches both."""
    return (json.dumps(doc, indent=2, sort_keys=False) + "\n").encode("utf-8")


def write_all(specs: list[SchemaSpec], out_dir: Path, echo: Callable[[str], None] = print) -> None:
    for spec in specs:
        target = out_dir / spec.service_id
        target.mkdir(parents=True, exist_ok=True)
        files = {
            "output-schema.json": output_schema(spec.results, spec.example),
            "input-schema.json": _input_schema(spec.requests),
            "openapi.json": openapi_document(spec),
        }
        for name, doc in files.items():
            (target / name).write_bytes(render(doc))
        echo(f"{spec.service_id}: wrote {', '.join(files)} → {target}")
