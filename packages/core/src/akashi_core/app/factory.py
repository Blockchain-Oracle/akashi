"""Build one sub-app per Pocket service and the root app that mounts them."""

from dataclasses import dataclass

from fastapi import APIRouter, FastAPI

from akashi_core.app.handlers import install_handlers
from akashi_core.app.middleware import BodyLimitMiddleware, DeadlineMiddleware
from akashi_core.app.probes import probe_router
from akashi_core.app.responses import AkashiJSONResponse
from akashi_core.constants.app import APP_VERSION, HEALTH_OK


@dataclass(frozen=True, slots=True)
class ServiceSpec:
    service_id: str  # on-chain ID, e.g. "citation-verify"
    prefix: str  # internal mount, e.g. "/cite"
    title: str
    deadline_s: float
    router: APIRouter


def _bare_app(**kwargs: object) -> FastAPI:
    # HTML docs are disabled: every response must be JSON. OpenAPI is exported at build time instead.
    app = FastAPI(
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        redirect_slashes=False,
        default_response_class=AkashiJSONResponse,
        version=APP_VERSION,
        **kwargs,  # type: ignore[arg-type]
    )
    install_handlers(app)
    return app


def create_service_app(spec: ServiceSpec) -> FastAPI:
    app = _bare_app(title=spec.title)
    app.include_router(probe_router(spec.service_id))
    app.include_router(spec.router)
    app.add_middleware(DeadlineMiddleware, budget_s=spec.deadline_s)
    app.state.service_id = spec.service_id
    return app


def create_root_app(specs: list[ServiceSpec]) -> FastAPI:
    root = _bare_app(title="akashi-api")

    @root.get("/v1/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": HEALTH_OK}

    for spec in specs:
        # The relayer turns GET / into GET <prefix> (no trailing slash); a Mount alone would not match it.
        def _prefix_root(service_id: str = spec.service_id) -> dict[str, str]:
            return {"service": service_id, "status": HEALTH_OK}

        root.add_api_route(spec.prefix, _prefix_root, methods=["GET", "HEAD"], include_in_schema=False)
        root.mount(spec.prefix, create_service_app(spec))
    root.add_middleware(BodyLimitMiddleware)
    return root
