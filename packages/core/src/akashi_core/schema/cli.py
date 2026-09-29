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


def _openapi(spec: SchemaSpec) -> dict[str, Any]:
    app = FastAPI(title=spec.title, version="1.0.0", openapi_url="/openapi.json")
    app.include_router(probe_router(spec.service_id))
    app.include_router(spec.router)
    return app.openapi()  # paths are prefix-free (/v1/...), as gateways and the portal call them


def write_all(specs: list[SchemaSpec], out_dir: Path, echo: Callable[[str], None] = print) -> None:
    for spec in specs:
        target = out_dir / spec.service_id
        target.mkdir(parents=True, exist_ok=True)
        files = {
            "output-schema.json": output_schema(spec.results, spec.example),
            "input-schema.json": _input_schema(spec.requests),
            "openapi.json": _openapi(spec),
        }
        for name, doc in files.items():
            (target / name).write_text(json.dumps(doc, indent=2, sort_keys=False) + "\n")
        echo(f"{spec.service_id}: wrote {', '.join(files)} → {target}")
