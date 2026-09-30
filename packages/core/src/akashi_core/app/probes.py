"""Cheap probe routes every service exposes (card healthchecks; gateways run them every cycle)."""

from fastapi import APIRouter

from akashi_core.constants.app import APP_VERSION, HEALTH_OK


def probe_router(service_id: str) -> APIRouter:
    router = APIRouter()

    @router.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
    async def root() -> dict[str, str]:
        return {"service": service_id, "status": HEALTH_OK}

    @router.get(
        "/v1/version",
        operation_id="version",
        summary="Service identity and version",
        description=(
            f"Returns the capability ID ({service_id}) and the release. Card health checks use it to confirm the "
            "backend behind a relayer is this service; it touches no upstream."
        ),
    )
    async def version() -> dict[str, str]:
        return {"service": service_id, "version": APP_VERSION}

    @router.get(
        "/v1/health",
        operation_id="health",
        summary="Readiness",
        description='Returns `{"status": "ok"}` when the process is serving. It touches no upstream.',
    )
    async def health() -> dict[str, str]:
        return {"status": HEALTH_OK}

    return router
