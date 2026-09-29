# S1 — Core backend

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §1–2, §6–7, §9 Core

## Steps
- [ ] Constants + settings (pydantic-settings, AKASHI_)
- [ ] Contract models, enums, UntrustedStr, errors + JSON handlers, AkashiJSONResponse (Tier-3 guard)
- [ ] Body-limit ASGI middleware (chunked) + request-context/Deadline
- [ ] App factory: sub-apps /cite /code /now, probes, redirect_slashes=False, bare-prefix routes
- [ ] HTTP registry (httpx2 per upstream, semaphores, limits, stamina) + SSRF guard
- [ ] Cache (cashews bytes codec, keys, TTL), SingleFlight, fan_out, spawn_background
- [ ] SQLite read-only manager
- [ ] Schema CLI (outputSchema/inputSchema/openapi per service)
- [ ] structlog + metrics on a separate port
- [ ] Dockerfiles api/worker/ts-introspect (non-root, uv sync --frozen, PYTHONTZPATH="")
- [ ] [OK?] Deploy app-redis, api, ts-introspect on Coolify

## Gate
`lint_backend.py --card --bad` passes; chunked curl OK; 413/400/404/405 JSON; `GET /cite` 200 (no 307).

## Findings

## Handoff
