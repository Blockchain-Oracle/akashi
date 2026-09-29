# S1 — Core backend

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §1–2, §6–7, §9 Core

## Steps
- [x] Constants + settings (pydantic-settings, AKASHI_)
- [x] Contract models, enums, UntrustedStr, errors + JSON handlers, AkashiJSONResponse (Tier-3 guard)
- [x] Body-limit ASGI middleware (chunked) + request-context/Deadline
- [x] App factory: sub-apps /cite /code /now, probes, redirect_slashes=False, bare-prefix routes
- [x] HTTP registry (httpx2 per upstream, semaphores, limits, stamina) + SSRF guard
- [x] Cache (cashews bytes codec, keys, TTL), SingleFlight, fan_out, spawn_background
- [x] SQLite read-only manager
- [x] Schema CLI (outputSchema/inputSchema/openapi per service)
- [x] structlog + metrics on a separate port
- [x] Dockerfile api (worker + ts-introspect Dockerfiles land with their code in S5/S3)
- [ ] Dockerfiles worker/ts-introspect (non-root, uv sync --frozen, PYTHONTZPATH="")
- [ ] [OK?] Deploy app-redis, api, ts-introspect on Coolify

## Gate
`lint_backend.py --card --bad` passes; chunked curl OK; 413/400/404/405 JSON; `GET /cite` 200 (no 307).

## Findings
- Context7 (FastAPI docs): override `RequestValidationError` + **Starlette's** `HTTPException`; format errors field-by-field (raw repr leaks file/line).
- `stamina` does not know `httpx2` → retryable exceptions passed explicitly (`httpx2.TransportError`, `RetryableStatus`). Confirms the spec's ⚠️.
- `limits` `RedisStorage` defaults to `coredis`; pinned `implementation="redispy"` (one Redis driver across the codebase).
- Mount alone does not match `GET /cite` (no slash): explicit bare-prefix routes added at the root; `redirect_slashes=False`.
- **Local checks (uvicorn):** `GET /cite` 200 JSON (no 307), `HEAD /cite` 200, 404 / 405 JSON, 70 KB body → 413 JSON for both Content-Length and **chunked** uploads, `x-request-id` header set.
- **Docker (linux/amd64):** image 72.8 MB, non-root uid 10001, 56.7 MiB RSS idle.
- **Pocket `lint_backend.py`:** 15/15 PASS across /cite /code /now (probes + 404/405 bad-input).
- **SSRF guard:** blocks 169.254.169.254, 127.0.0.1, [::1], `app-redis`, `*.internal`, non-http schemes; example.com → 206 with a 64 KiB cap. ⚠️ DNS is checked, then httpx2 re-resolves (rebinding TOCTOU). **Pin the connection to the vetted IP in S4** when web fetching goes live.
- Invalid-JSON → 400 `invalid_json` is not yet exercised (no POST route); verify in S3 with the first real endpoint.
- Gates: `ruff check` (incl. PLR2004 no-magic-numbers) ✅ · `ruff format` ✅ · `pyright` 0 errors ✅.

## Handoff
- Remaining: [OK?] deploy app-redis + api on Coolify (validates internal networking early); ts-introspect/worker Dockerfiles with their code.
