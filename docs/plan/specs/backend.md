# Spec — Akashi 証 backend (citation-verify · code-reality-check · live-facts)

> **Source:** Plan agent "Detailed backend services design", 2026-09-29, transcribed by the main session right after the plan was approved.
> **Reconciled with `../00-plan.md` (the approved plan wins wherever they differ):**
> - **Service IDs** are capability-named: `akashi-cite` → **`citation-verify`**, `akashi-code` → **`code-reality-check`**, `akashi-now` → **`live-facts`**. Internal path prefixes stay `/cite`, `/code`, `/now`. The envelope's `service` field carries the on-chain ID.
> - **CUPR** follows the runbook values: citation-verify **40,000**, code-reality-check **20,000**, live-facts **10,000**. §4 below records the design's original reasoning.
> - **Functional probes** are this spec's local, deterministic ones: Obergefell / axios fetchJson / Casablanca time.
>
> **Markers:** "(src: …)" points to where a fact came from. ⚠️ marks something not yet verified. Items marked "measured today" are the agent's own read-only probes from 2026-09-29.

## Findings that change the earlier draft
1. **`typescript@latest` is 7.0.2**, the native Go compiler. It exports only `./unstable/*` JS APIs. The tssym prototype relies on the classic Compiler API (`createProgram`, `getTypeChecker`), so **pin `typescript@6.0.3` exactly** in ts-introspect.
2. **CourtListener bulk sizes (range-read 2026-09-29).**
   - `citations` CSV header: `id,volume,reporter,page,type,cluster_id,date_created,date_modified`. It compresses about 6.6×, so the 127 MB bz2 is about 840 MB of CSV and about 7.6 M rows.
   - `opinion-clusters` compresses about 4.2×, so the 2.46 GB bz2 is about 10 GB of CSV, with multiline fields.
3. **Frankfurter v2 can filter by provider: `?providers=ECB`.** A multi-provider call returns one blended row, so the FX consensus comes from **N parallel single-provider calls to independent central banks**.
   - USD→EUR on 2026-09-29: ECB 0.87889 (09-28), FRED 0.87719 (**09-25**, stale), BOC 0.87951 (09-28).
4. **One `outputSchema` per service, not per endpoint.** The portal registry holds a single `outputSchema` plus a `methods` map (src: `context/02-agentic-portal/overview.md`). Every result item therefore carries a `kind` discriminator (§2.8).
5. **Traps with a relayer backend URL that has a path.**
   - With `url: http://api:8000/cite`, `GET /` becomes `path.Join("/cite","/")` = `/cite` with no trailing slash (src: design-rules §9).
   - A Starlette `Mount` plus `redirect_slashes` answers that with a **307 and no JSON body**, which gets penalized. Register bare `/cite`, `/code` and `/now` routes explicitly and set `redirect_slashes=False`.
   - `uvicorn --limit-concurrency` returns a **plain-text 503**. Never use it.
6. **The GDELT GKG 15-minute file is 4.9 MB zipped** (`lastupdate.txt`), so ingesting it is cheap.

---

## 1. Package and module structure
Dependency direction: `akashi_core` ← {`akashi_cite`, `akashi_code`, `akashi_now`} ← {`akashi_api`, `akashi_worker`}.
- Domain packages never import each other.
- Writers (ingest and build) sit next to their readers inside the domain package. The worker only schedules them.
- The package is named **`akashi_code`**, never `code`, which would shadow the stdlib `code` module.

```
akashi/
  pyproject.toml                      uv workspace: members packages/*, services/api, services/worker
  packages/core/src/akashi_core/
    constants/  __init__.py  http.py  deadlines.py  sage.py  cache.py  upstreams.py  probes.py
    settings.py                       AkashiSettings (pydantic-settings, env_prefix="AKASHI_")
    contract/   envelope.py  sources.py  errors.py  enums.py  fields.py
    errors.py                         AkashiError, InvalidInput, UpstreamFailure(name, kind)
    app/        factory.py  handlers.py  middleware.py  probes.py  responses.py
    deadline.py  fanout.py  singleflight.py  safety.py  text.py  timeutil.py
    http/       registry.py  client.py  ratelimit.py  ssrf.py
    cache/      setup.py  keys.py  ttl.py  codec.py
    storage/    sqlite.py             read-only SQLite manager (reopen on atomic swap)
    schema/     generate.py  cli.py   outputSchema/inputSchema/OpenAPI export
    obs/        logging.py  metrics.py  server.py
  packages/cite/src/akashi_cite/
    constants.py  models.py  verdicts.py  router.py  service.py  probe.py
    parse/      router.py  ids.py  scholarly.py  legal.py
    sources/    doi_handle.py  doi_ra.py  crossref.py  datacite.py  openalex.py  pubmed.py
                europepmc.py  retraction_db.py  cap.py  legal_index.py  web.py  wayback.py
    match/      normalize.py  score.py  diff.py
    nli/        model.py  sentences.py  judge.py  premise.py
    legal/      build_index.py  schema.sql            (used by the worker CLI)
    retraction/ build.py                              (used by the worker)
  packages/code/src/akashi_code/
    constants.py  models.py  verdicts.py  router.py  service.py  probe.py  ecosystems.py
    registries/ base.py npm.py pypi.py cargo.py go.py maven.py rubygems.py packagist.py nuget.py depsdev.py
    risk/       placeholder.py  typosquat.py  toplists.py  freshness.py
    versions/   resolve.py
    symbols/    base.py  suggest.py  npm.py  go.py  rust.py
                python/ zip_range.py  wheel.py  astindex.py  stdlib.py
    snippet/    languages.py  extract.py  bindings.py  import_map.py  check.py
                queries/ python.scm typescript.scm javascript.scm go.scm rust.scm
    data/       py_import_map.json  node_builtins.json
    toplists/   build.py                              (worker)
  packages/now/src/akashi_now/
    constants.py  models.py  router.py  probe.py  provenance.py  consensus.py  freshness.py
    time/     zones.py  tzdb.py  business_days.py  tzdb_news.py (worker parser)
    holidays/ local.py  nager.py  openholidays.py  merge.py
    fx/       frankfurter.py  ecb.py  service.py
    weather/  metno.py  nws.py  geocode.py  service.py
    facts/    properties.py  wikidata.py  wikipedia.py  service.py
    news/     gdelt_ingest.py  index.py  hn.py  dedupe.py  service.py
    stocks/   twelvedata.py  massive.py  sec_tickers.py  market_hours.py  service.py
    jobs/     ats/{greenhouse,lever,ashby,smartrecruiters}.py  normalize.py  ingest.py  index.py  service.py
    data/     job_boards.json  tz_recent_changes.seed.json
  services/api/      Dockerfile  pyproject.toml  src/akashi_api/{main.py, lifespan.py, demo.py}
  services/worker/   Dockerfile  pyproject.toml  src/akashi_worker/{main.py, schedule.py, cli.py, jobs/*.py}
  services/ts-introspect/  package.json  tsconfig.json  Dockerfile
    src/ index.ts constants.ts schemas.ts
         fetch/{registry.ts, tarball.ts, jsdelivr.ts}
         resolve/{entry.ts, types-fallback.ts}
         program/{host.ts, cache.ts}
         lookup/{symbol.ts, signature.ts, suggest.ts}
  cards/<service-id>/  card.json  openapi.json  output-schema.json  input-schema.json  registry.json
```

**How the api is assembled**
- `akashi_api.main` builds a root FastAPI app with `docs_url=None`, `redoc_url=None`, `openapi_url=None` and `redirect_slashes=False`.
- It mounts three sub-apps built by `akashi_core.app.factory.create_service_app(service_id, router, deadline_s)`:
  - Each sub-app gets JSON exception handlers, probe routes, and its own OpenAPI with paths `/v1/...` (the per-service spec audit A8 wants).
  - That OpenAPI is exported at build time, not served publicly.
- Root middleware, outermost first: BodyLimit → RequestContext (request id + deadline) → metrics.
- Root routes: `GET/HEAD /cite|/code|/now` and `/v1/health`.
- The `/demo/*` mount is reachable only from the web container, through a shared-secret header. The relayer can't reach it because `path.Join` cleans `..`.

---

## 2. Shared core

### 2.1 Contract models (`contract/`)
```python
class Tristate(StrEnum): yes="yes"; no="no"; unknown="unknown"          # never bool|str unions
class Agreement(StrEnum): agree, minor_diff, conflict, single_source
class SourceStatus(StrEnum): ok, not_found, unavailable, rate_limited, skipped_budget, not_applicable
class CacheState(StrEnum): hit, miss, stale
class SourceRef(BaseModel):     # every upstream touched
    name: str; status: SourceStatus; url: str|None; licence: str|None; attribution: str|None
    as_of: str|None; fetched_at: str|None; latency_ms: int|None; cache: CacheState|None
class Envelope(BaseModel, Generic[T]):   # FIELD ORDER = BYTE ORDER (2 KB rule)
    service: Literal["citation-verify","code-reality-check","live-facts"]; operation: str; version: str
    status: Literal["complete","partial"]; as_of: str; deadline_ms: int; elapsed_ms: int
    unavailable: list[str]        # source names only (e.g. "crossref") — safe words
    summary: dict[str,int]        # counts per verdict
    results: list[T]              # untrusted text lives here
    sources: list[SourceRef]; notes: list[str]
class ErrorBody(BaseModel): code: ErrorCode; message: str; retryable: bool; details: list[str] = []
class ErrorCode(StrEnum): invalid_json, invalid_input, not_found, method_not_allowed,
                          payload_too_large, unsupported, internal
```

**Verdict enums**
- **cite:** `verified | mismatch | not_found | retracted | ambiguous | unverifiable`; claims use `supported | contradicted | insufficient_evidence | no_evidence_text`.
- **code, package:** `ok | does_not_exist | placeholder | likely_typo | suspicious_new | deprecated | yanked`. Symbols use `Tristate`.
- **now:** `Agreement` plus a freshness enum `fresh | stale | unknown`.

**Untrusted text.** Every upstream-derived string is `UntrustedStr = Annotated[str, PlainSerializer(scrub_tier3)]` (`fields.py`): titles, descriptions, deprecation messages, case names, headlines.

**Partial failures.** An upstream failure never produces a 5xx.
- `status="partial"` marks a degraded result. A per-item `unverifiable`/`unknown` carries `retryable: true`.
- The response is still 200: the request was valid and answered honestly, so it is paid and not penalized (src: design-rules §5).

### 2.2 Exception handlers (`app/handlers.py`, on the root and each sub-app)
- `RequestValidationError` → 422 `invalid_input` (loc and msg joined).
- JSON decode error → 400 `invalid_json`.
- `StarletteHTTPException` → its status with a JSON body (404 `not_found`, 405 `method_not_allowed`).
- `AkashiError` → its mapped 4xx.
- `Exception` → 500 `internal`, logged with the request id. This is the only 5xx path.

All of these go through `AkashiJSONResponse`. It renders with pydantic-core/orjson, **asserts the first 2,048 bytes of a success body are free of Tier-3 phrases**, and never gzips.

Probe routes use `api_route("/", methods=["GET","HEAD"])`, because FastAPI does not add HEAD automatically ⚠️ (verify).

### 2.3 Body limit (`app/middleware.py`, pure ASGI)
- Reject early on `Content-Length > MAX_REQUEST_BYTES`.
- Otherwise wrap `receive` and count `http.request` chunk bytes. RelayMiner sends **chunked bodies with no Content-Length**.
- Short-circuit with a 413 `payload_too_large` JSON the moment the limit is crossed.

### 2.4 Deadlines and fan-out (`deadline.py`, `fanout.py`, `singleflight.py`)
- `Deadline(started, budget_s)` lives in a ContextVar.
  - `remaining()`.
  - `for_call(cap_s) = min(cap_s, remaining() - DEADLINE_SAFETY_MARGIN_S)`.
- `fan_out(named: Mapping[str, Awaitable[T]], deadline) -> FanOutResult{ok, failed: {name: reason}}`:
  - uses `asyncio.wait(..., timeout=deadline.remaining())`;
  - cancels whatever is still pending (reason `deadline_exceeded`);
  - catches exceptions per task.
  - **No TaskGroup**: it cancels siblings on the first error.
- `gather_limited(iterable, limit)` handles batches.
- `SingleFlight[key]` shares one in-flight future.
- `spawn_background(key, coro)` lets a cold symbol build finish after the response is sent and fill the cache (the "pending" pattern).

### 2.5 Upstream client registry (`http/registry.py`, `client.py`, `ratelimit.py`)
- `UpstreamSpec(name, base_url, http2, connect_s, total_s, max_concurrency, rate, shared_quota, retry_attempts, licence, attribution)`.
- **One `httpx2.AsyncClient` per upstream:**
  - `Limits(max_connections=max_concurrency, keepalive_expiry=KEEPALIVE_S)`;
  - UA `akashi/<ver> (+<repo-url>; mailto:<contact>)`;
  - per-request timeout from `Deadline.for_call`.
- **Concurrency and rates:** concurrency via an asyncio.Semaphore; rates via `limits` moving-window (in-memory for api-only upstreams, **Redis storage** for quotas shared with the worker: Twelve Data, Massive, crates.io API, Wikidata).
- **Retries:** `stamina.retry_context(on=(httpx2.TransportError, RetryableStatus), attempts=2, timeout=deadline.remaining())`.
  - Idempotent GETs only: connect errors, 502/503/504, and 429 when `Retry-After` is less than the time remaining.
  - Pass the exception types explicitly: stamina's httpx auto-detection won't see httpx2 ⚠️.
- **Upstream bodies are never passed through.** Non-2xx, HTML or plain text becomes `UpstreamFailure(kind=http_status|network|decode|deadline)`, which becomes `SourceRef.status` plus an `unavailable` entry.
- **`http/ssrf.py`** (for user-supplied URLs):
  - resolve DNS first; reject private, loopback, link-local, CGNAT, multicast, IPv6 ULA and Docker service names;
  - connect to the vetted IP with SNI/Host set;
  - limit redirects and re-validate each hop;
  - cap reads at `URL_FETCH_MAX_BYTES`.

| Upstream | Concurrency / rate | Per-call total s | Source |
|---|---|---|---|
| Crossref (polite) | **3 concurrent**, 10 rps single / 3 rps lists | 2.5 | citation §2 |
| doi.org handle / RA | 8 | 1.5 | handle p50 0.34 s |
| DataCite | 3 rps (1000/5 min) | 2.5 | |
| OpenAlex | 5; search ≤ 1000/day with free key | 2.5 | |
| PubMed E-utils | 3 rps (10 with key) | 2.5 | |
| Europe PMC | 2 | 3.0 | 12 s outlier measured |
| Wayback availability | 2 | 3.0 | CDX excluded |
| CAP static | 4 | 2.5 | p50 0.86 s |
| npm registry / downloads | 20 | 2.0 | |
| PyPI JSON + files (h2) | 10 | 2.5 | |
| crates sparse index | 10 | 2.0 | CDN |
| crates.io API | **1 rps** shared | 2.0 | RFC 3463 |
| Go proxy / pkg.go.dev | 8 | 2.5 | |
| docs.rs | 3 | 3.0 | JSON 0.7–1.0 s |
| deps.dev | 5 | 2.0 | batch 0.7 s |
| Packagist p2 | ≤ 10 | 2.5 | |
| RubyGems | 10 rps | 2.0 | |
| NuGet flat, Maven metadata | 5 | 2.0 | |
| jsDelivr | 10 (< 100 RPM sustained) | 2.0 | |
| Frankfurter | 10 | 1.5 | p50 95 ms |
| ECB XML | 2 | 2.0 | |
| MET Norway | ≤ 20 rps, honour `Expires` | 2.5 | met.no ToS |
| NWS | 4 | 2.5 | |
| Wikidata SPARQL | 2 concurrent | 2.5 | UA required |
| Nager / OpenHolidays | 4 | 1.5 | |
| HN Algolia | 4 | 1.5 | |
| Twelve Data (free key) | **8/min, 800/day** shared ⚠️ | 1.5 | |
| Massive Basic (free key) | **5/min** shared | 1.5 | |
| SEC tickers (worker) | 10 rps, UA with email | 5 | |

### 2.6 Cache (`cache/`)
- **Setup:** cashews on `redis://app-redis:6379/0`, connect timeout about 0.2 s, **`suppress` on** (a Redis outage becomes a cache miss).
- **Storage format:** bytes only, through `codec.py` (orjson, plus zstd above `CACHE_COMPRESS_MIN_BYTES=4096`). No pickle, so the worker and api can share entries.
- **Keys:** `ak:{svc}:{source}:{kind}:v{CACHE_SCHEMA_VERSION}:{id}`. Long ids are hashed with blake2b-16. Keys are built only in `cache/keys.py`.
- **Refresh:** cashews `early` refresh for FX and weather.
- **Redis config:** `maxmemory 128mb`, `allkeys-lru`. "Forever" keys have no TTL and are evicted by LRU.

| Key | TTL | Why |
|---|---|---|
| `cite:doi_ra:prefix:{10.1038}` | 30 d | RA is fixed per prefix |
| `cite:crossref:work:{doi}` | 24 h | retraction status can change |
| `cite:crossref:biblio:{hash}` | 24 h | |
| `cite:datacite:{doi}`, `pubmed:*` | 7 d | |
| `cite:openalex:work:{doi}` | 24 h | |
| `cite:cap:vol:{reporter}:{vol}` | 30 d | CC0 static |
| `cite:web:{url}` / `cite:wayback:{url}` | 1 h / 24 h | |
| `cite:nli:{hash(model,premise,claim)}` | 30 d | deterministic |
| `code:{eco}:ver:{name}@{v}` | 1 h | deprecated/yanked can change |
| `code:{eco}:latest:{name}` | 10 min | |
| `code:{eco}:missing:{name}` | **5 min** | a squatter may register the name |
| `code:npm:dl:{name}` | 24 h | |
| `code:sym:{eco}:{name}@{v}` | ∞ | immutable versions |
| `code:py:cd:{wheel_sha256}` | ∞ | |
| `now:fx:{provider}:{base}` | until the next expected publish (min 10 min, max 6 h) | |
| `now:holidays:{src}:{cc}:{year}` | 24 h | |
| `now:metno:{lat4},{lon4}` | response `Expires` | met.no ToS |
| `now:nws:points:{lat4},{lon4}` | 30 d | |
| `now:wikidata:{hash}` | 1 h | |
| `now:stocks:quote:{sym}` | 60 s in session; until next open when closed | free quota |
| `now:hn:{hash}` | 2 min | |
| `now:tzdb:latest`, `now:tzdb:recent` | 36 h | written by the daily job |

### 2.7 SQLite reader (`storage/sqlite.py`)
- One `threading.local` connection per worker thread, opened `file:{path}?mode=ro`, with `PRAGMA cache_size=-16000` and `mmap_size=0`.
- Queries run through `anyio.to_thread.run_sync`.
- Every `INDEX_RELOAD_CHECK_S`, compare inode and mtime and reopen after an atomic swap.
- Built indexes (legal, retraction) are swapped with `os.replace`. Incremental ones (news, jobs) use WAL.

### 2.8 Schema generator (`schema/generate.py`, `uv run akashi-schemas`)
For each service:
1. Take `model_json_schema(mode="serialization")` for the envelope and each result item.
2. Inline all `$defs`.
3. Strip `title`, `format`, `default`, `example` and `additionalProperties:false`.
4. Build the root schema:
   ```
   {"$schema": 2020-12, type: object,
    properties: {…envelope, typed…,
                 results: {type: array, items: {anyOf: [one item schema per kind, each with a kind const]}},
                 error: {…}},
    required: ["service"],
    examples: [the captured probe body]}
   ```
5. Validate against captured bodies with `jsonschema.Draft202012Validator` and Ajv2020 strict (rules 1–12 in `context/05-external-libs/json-schema-output-schemas.md`).

It also emits `input-schema.json` and a prefix-free `openapi.json` into `cards/<id>/`.

### 2.9 Probes (`app/probes.py`)
| Route | Response |
|---|---|
| `GET/HEAD /` | `{"service":id,"status":"ok"}` |
| `GET /v1/version` | `{"service":id,"version":APP_VERSION}` |
| `GET /v1/health` | `{"status":"ok"}` |

- They are cheap. The lifespan hook finishes warm-up before the port opens, so a healthy response also means ready.
- The relayer's `expected_body '"ok"'` is a substring match.
- The relayer joins the health-check path onto the backend URL's path (`relayer/healthcheck.go:538`), so it hits `/cite/v1/health`.

### 2.10 Constants (`akashi_core/constants/*` + each package's `constants.py`)
| Constant | Value | Justification |
|---|---|---|
| `MAX_REQUEST_BYTES` | 65_536 | plan; portal cap ≈ 64 KiB |
| `TIER3_PATTERNS` | ("timeout","connection refused","connection reset","bad gateway","service unavailable","gateway timeout","502 bad gateway","503 service unavailable","504 gateway timeout") | design-rules §6 |
| `TIER3_WINDOW_BYTES` | 2_048 | design-rules §6 |
| `TIER3_REPLACEMENT_HYPHEN` | "‑" | non-breaking hyphen ("time‑out") |
| `CITE_DEADLINE_S` / `CITE_TARGET_P95_S` | 8.5 / 6.0 | citation §7 |
| `CODE_DEADLINE_S` | 7.0 | code §8 |
| `NOW_DEADLINE_S` / `NOW_TARGET_P95_S` | 4.0 / 3.0 | live-facts budget |
| `DEADLINE_SAFETY_MARGIN_S` | 0.25 | serialization + relayer hop (inference) |
| `DEFAULT_CONNECT_S` / `DEFAULT_TOTAL_S` | 1.0 / 2.5 | |
| `KEEPALIVE_S` | 90 | inference |
| `CACHE_SCHEMA_VERSION` | 1 | |
| `CACHE_COMPRESS_MIN_BYTES` | 4_096 | inference |
| `INDEX_RELOAD_CHECK_S` | 60 | |
| `DEMO_PER_MINUTE` / `DEMO_PER_DAY` | 10 / 200 | inference, web demo |
| `METRICS_PORT` | 9102 | separate port |
| `APP_VERSION` | "1.0.0" | card implementations |

---

## 3. Services

### 3.1 citation-verify (`/cite`)
**Endpoints**
- **`POST /v1/verify`**
  - Request: `{citations: list[CitationInput] (1..MAX_CITATIONS_PER_REQUEST=10), options?: {check_urls=true, retraction=true}}`.
  - `CitationInput` is a `str` of at most 2,000 chars, or `{raw?, doi?, arxiv?, pmid?, title?, authors?: list[str] ≤ 30, year?: 1500..2100, venue?, volume?, pages?, url?, legal_cite?}`.
  - Item (`kind:"citation"`) fields:
    - `index`, `input_kind` (scholarly|legal|web|statute), `verdict`, `confidence` (0..1);
    - `matched` `{doi, title, authors[], year, venue, volume, pages, type, url, record_source}`;
    - `field_diffs[] {field, given, found, severity(major|minor)}`;
    - `retraction {status: retracted|corrected|expression_of_concern|none, date, notice_doi, source}`;
    - `candidates[]` (≤ 3, only when ambiguous);
    - `legal {reporter, volume, page, case_name, date_filed, court, cl_url, index_as_of}`;
    - `web {http_status, liveness: live|dead|blocked|unreachable, final_url, page_title, archived_url, archived_at}`;
    - `reasons[]`, `retryable`.
- **`POST /v1/claim`**
  - Request: `{claim ≤ 1000, citation?: CitationInput, evidence_text? ≤ 20_000}`; at least one of `citation` / `evidence_text`.
  - Item (`kind:"claim"`) fields: `verdict`, `scores {entailment, neutral, contradiction}`, `evidence_sentence`, `evidence_scope: abstract|provided_text|page_text`, `premise_source`, `model: "deberta-v3-base-mnli-fever-anli-int8"`, `matched_citation`.
- **Functional probe:** `POST /v1/verify {"citations":["Obergefell v. Hodges, 576 U.S. 644 (2015)"]}` → `$.results[0].verdict ^verified$`. It is purely local (legal index), so it is cheap and deterministic.

**Verify algorithm.** Per citation; items run through `gather_limited` under the request deadline.
1. **Classify** (`parse/router.py`):
   - `idutils` finds DOI / arXiv / PMID / URL, in a field or inside `raw`;
   - eyecite finds legal cites (runs in a thread);
   - anything else is scholarly free text.
   - For legal input, **split `raw` on `;` before calling eyecite** (year-leak bug).
2. **DOI path.**
   - `doi_handle` (0.34 s) and `doi_ra` (RA per prefix, cached 30 d) run in parallel. Handle not found → `not_found`.
   - Otherwise, **in parallel**: the RA record (Crossref `/works/{doi}` with a `select` projection, or DataCite `/dois/{doi}`), OpenAlex `works/doi:` (`is_retracted`, abstract), and the local Retraction Watch DB.
   - arXiv resolves through DataCite as `10.48550/arXiv.{id}`; arXiv is never called live.
   - PMID → PubMed esummary.
3. **No-DOI scholarly path.**
   - Crossref `query.bibliographic=<raw|assembled>&rows=5&select=DOI,title,author,issued,container-title,short-container-title,volume,page,type,score,updated-by`.
   - In parallel: PubMed `ecitmatch` when journal, volume and page are present.
   - If the best Crossref score is below `CROSSREF_SCORE_FLOOR=40`, or Crossref is unavailable → OpenAlex `search` (free key). Calibration so far: a fake scored 30.6, a runner-up 48.0, the real one 65.9 (n=1).
4. **Scoring** (`match/score.py`). Normalize first: casefold, NFKD accent strip, drop punctuation, `rapidfuzz.utils.default_process`.
   - `title`: `fuzz.token_sort_ratio/100`, weight **0.50**. For raw-string input, use `partial_token_set_ratio(candidate_title, raw)`.
   - `authors`: 0.6 × first-author family name (exact = 1; `fuzz.ratio` ≥ 90 → 0.8) + 0.4 × Jaccard of family-name sets. Weight **0.25**.
   - `year`: exact = 1.0, ±1 = 0.7. Weight **0.15**.
   - `venue`: `max(token_set_ratio(full), token_set_ratio(short))`. Weight **0.10**.
   - Weights are renormalized over the fields actually given.
   - **Verdict rules:**
     - composite ≥ `VERIFIED_MIN=0.85` and no major diff → `verified`;
     - `title ≥ 0.90` plus a year/author/venue diff → `mismatch` with `field_diffs`;
     - top two ≥ `MISMATCH_MIN=0.65` and within `AMBIGUOUS_DELTA=0.05` of each other → `ambiguous`;
     - < 0.65 → `not_found`;
     - every source unavailable → `unverifiable`, `retryable:true`.
   - The thresholds are provisional; calibrate them in S4.
5. **Retraction overlay.**
   - Signals: Crossref `updated-by[]` with type in {retraction, correction, expression_of_concern} and source `retraction-watch` or `publisher`; OpenAlex `is_retracted`; the local RW DB.
   - Any retraction sets the verdict to `retracted`. A correction is only flagged.
6. **Legal path.**
   - eyecite `FullCaseCitation` gives volume, `corrected_reporter()`, page, year, court and parties.
   - Look up `legal.db`: (reporter_id, volume, page) → cluster_ids. If the clusters projection exists, compare case names (`token_set_ratio(parties, case_name)` ≥ 80) and the year against `date_filed`.
   - Hit → `verified`, or `mismatch` on name/year.
   - Miss → the CAP volume (CC0, ≤ 2014 US / ≤ 2019 F.3d):
     - page falls **inside** another case's `first_page..last_page` → `mismatch`, reason `page_inside_other_case`;
     - otherwise → `not_found`.
     - The fake Varghese cite, 925 F.3d 1339, lands here.
   - A cite dated after `index_as_of` (2026-06-30), or in a reporter outside coverage → `unverifiable`.
   - Link-out: `https://www.courtlistener.com/c/{reporter}/{vol}/{page}/`.
   - Statutes (`42 U.S.C. § 1983`) → `input_kind:"statute"`, `unverifiable`, with a note pointing to Pocket's `us-code-cfr` service.
   - `Id.` and supra forms are skipped with a note.
7. **Web path.**
   - `ssrf.safe_get`: HEAD, then GET with `Range: bytes=0-65535`, at most 5 redirects. **Wayback availability runs in parallel** (3 s).
   - On 2xx, parse `<title>`, `og:title`, `citation_title` and `citation_doi`. A `citation_doi` goes to the DOI path.
   - Liveness:
     - 404/410 → `dead`;
     - **401/403/429 → `blocked`, never dead**;
     - DNS or connect failure → `unreachable`.
   - Verdict = liveness + title similarity.
8. **Batch** under `CITE_DEADLINE_S`. Late sources go to `unavailable`, and affected items become `unverifiable`.

**Claim algorithm** (`nli/`)
1. **Pick the premise**, first available wins: `evidence_text` → the OpenAlex `abstract_inverted_index` (reconstructed) → Europe PMC `abstractText` (3 s) → the Crossref JATS abstract (stripped) → web page text (64 KB fetch). None → `no_evidence_text`.
2. **Split into sentences:** an abbreviation-guarded regex, at most `NLI_MAX_PREMISE_SENTENCES=16`, plus sliding pairs of adjacent sentences.
3. **Tokenize:** `tokenizers` (`tokenizer.json` from the Xenova repo), pairs of (sentence, claim), `enable_truncation(NLI_MAX_TOKENS=256, strategy="only_first")`, padding.
4. **Run:** one batched ORT run.
   - Read `session.get_inputs()` at load time; `token_type_ids` may be absent ⚠️.
   - Take `id2label` from `config.json`, then softmax.
5. **Verdict rules:**
   - max entailment ≥ `NLI_ENTAIL_MIN=0.80`, and that sentence's contradiction < 0.20 → `supported`;
   - max contradiction ≥ `NLI_CONTRA_MIN=0.80` → `contradicted`;
   - otherwise → `insufficient_evidence`.
   - Return the argmax sentence and state its scope.
6. **Execution:** CPU work runs through `anyio.to_thread` behind `NLI_MAX_CONCURRENCY=2`, with ORT `intra_op_num_threads=2` and `enable_cpu_mem_arena=False`.

#### 3.1.5 CourtListener bulk index
- **Tier A (required): `citations`.**
  - Streaming build: httpx2 stream → `bz2.BZ2Decompressor` → `csv.reader`.
  - Table `(reporter_id SMALLINT, volume INT, page TEXT, cluster_id INT)`, `WITHOUT ROWID`, primary key `(reporter_id, volume, page, cluster_id)`; `reporters(id,name)` is interned.
  - Batches of 50k rows with `journal_mode=OFF, synchronous=OFF`, then `VACUUM`, then `os.replace`.
  - About 7.6 M rows, **≈ 250–350 MB**.
- **Tier B (optional, `AKASHI_LEGAL_CLUSTERS_ENABLED`): the `opinion-clusters` projection.**
  - Keeps `(id, date_filed INT days, case_name ≤ 96 chars)`. The multiline CSV needs `csv.field_size_limit` raised.
  - About **0.6–0.9 GB**, and a 20–40 min build.
- **Build on the dev Mac**, never on the 4-vCPU server: `uv run akashi-worker build-legal-index --out legal.db`. Then rsync the zstd-compressed file to `/data`.
- **RAM:** only the 16 MB page cache.
- **Fallback:** Tier A only, with case names from CAP (≤ 2019) and after that `unverifiable_name`.
- ⚠️ The licence is unconfirmed. ⚠️ Check `df -h` first.

### 3.2 code-reality-check (`/code`)
`Ecosystem = npm | pypi | cargo | go | maven | rubygems | packagist | nuget`. Symbol support covers npm, pypi, go and cargo only; the rest return `unknown` with reason `symbols_not_supported_for_ecosystem`.

**Endpoints**
- **`POST /v1/package`** `{ecosystem, name ≤ 214, version?}`.
  - Item (`kind:"package"`) fields:
    - `verdict`, `risk_signals[]`, `exists: Tristate`;
    - `typo_of {name, distance, method, target_rank}`, `did_you_mean[]`;
    - `latest`, `version_exists: Tristate`, `deprecated` + reason, `yanked` + reason, `project_status`;
    - `first_published`, `latest_published`, `versions_count`, `downloads_last_week`, `versions_tail[]` (≤ 10);
    - `see_also` → `package-advisories` / `taint-check`.
- **`POST /v1/packages`** `{items ≤ 100}`, plus `summary`. With ≥ 5 items, deps.dev `versionbatch` enriches; the registry stays authoritative.
- **`POST /v1/symbol`** `{ecosystem, package, version?, symbol ≤ 300}`.
  - Item (`kind:"symbol"`) fields: `package_exists`, `resolved_version`, `exists: Tristate`, `kind` (function|class|method|property|type|const|module|interface|trait|struct), `signature` (≤ 500), `overloads[]` (≤ 5), `defined_in`, `did_you_mean[]` (≤ 5), `evidence_source` (d.ts|pyi|py-ast|rustdoc|pkgsite|go-src|typeshed), `pending`, `retry_after_ms`, `reason`.
- **`POST /v1/symbols`** `{…, symbols ≤ 50}` loads the artifact once for all of them.
- **`POST /v1/versions`** `{ecosystem, name, range?}`. Item (`kind:"versions"`): `resolved`, `dist_tags`, `versions[]` (≤ 200, newest first), `truncated`.
- **`POST /v1/check`** `{language: python|typescript|javascript|go|rust, code ≤ 49_152 bytes, versions?: {pkg: ver} ≤ 50}`.
  - Items (`kind:"diagnostic"`) fields:
    - `line`, `column`, `end_line`, `end_column`, `text`, `ref_kind` (import|call|attribute), `package`, `target`;
    - `verdict` (ok|nonexistent_package|placeholder|likely_typo|nonexistent_symbol|deprecated|unknown);
    - `signature`, `fix_hint`, `did_you_mean[]`.
- **Functional probe:** `POST /v1/symbol {"ecosystem":"npm","package":"axios","version":"1.7.9","symbol":"AxiosInstance.fetchJson"}` → `$.results[0].exists ^no$`. The version is pinned, so it is cached forever.

**Package verdict algorithm.** Upstreams run in parallel via `fan_out`:
- **npm:** `/<pkg>/<ver>` or `/latest`, plus `api.npmjs.org/downloads/point/last-week`. The first-publish date needs the abbreviated packument only on a miss; full packuments are 7 MB. ⚠️ The abbreviated form lacks `time`, so use deps.dev `publishedAt`.
- **PyPI:** `/pypi/<n>/<v>/json`. Project status comes from the Simple JSON API ⚠️ (PEP 792).
- **cargo:** sparse index `index.crates.io/{prefix}/{name}`, with `yanked` per line.
- **go:** proxy `@v/list` / `@latest`.
- **Others:** NuGet flat container, RubyGems `gems/<n>.json`, Packagist `p2`, Maven `maven-metadata.xml`.

Verdict precedence: `does_not_exist` > `placeholder` > `likely_typo` > `suspicious_new` > `yanked`/`deprecated` > `ok`.

- **Placeholder** (any of):
  - npm version matches `^0\.0\.1-security(\.\d+)?$`;
  - description matches `PLACEHOLDER_PATTERNS` (placeholder, "security holding package", "prevent dependency confusion", reserved, "name squat", "do not use");
  - npm `dist.unpackedSize < 1_024` with `fileCount ≤ 2` and no main/exports;
  - PyPI project status quarantined/archived ⚠️.
  - Evidence strings are always returned.
- **Typosquat:**
  - Normalize names: PEP 503 for PyPI; npm scope and name compared separately; lowercase.
  - A name already in the top-N list → skip.
  - Otherwise check generator hits: omission, repetition, adjacent transposition, keyboard-adjacent substitution, homoglyphs (rn→m, 1→l, 0→o), delimiter swap or removal, and affixes (`-js`, `node-`, `py-`, `python-`, `-cli`). Reimplemented after typomania / typogard.
  - Plus `rapidfuzz.process.extract(name, toplist, scorer=DamerauLevenshtein.distance, score_cutoff=d, limit=5)` with `d = TYPO_MAX_DISTANCE=2` (1 when the name has ≤ `TYPO_SHORT_NAME_LEN=5` chars).
  - Flag when the target's popularity is ≥ `TYPO_POPULARITY_RATIO=100`× the candidate's, or the candidate doesn't exist.
  - **Top lists:** npm `npm-high-impact` (MIT, 17,338); PyPI hugovk top 15k (⚠️ no licence); crates top 1k via the API at 1 rps, weekly.
- **Suspicious new:** first publish < `SUSPICIOUS_NEW_DAYS=90` and weekly downloads < `SUSPICIOUS_MAX_WEEKLY_DOWNLOADS=1_000`; or `versions_count ≤ 2` and age < 90 days.
- **Did you mean:** npm `/-/v1/search?size=5` merged with the nearest top-N names.
- **Versions:** `packaging.specifiers` (PyPI), `semantic_version.NpmSpec` (npm), `SimpleSpec` (cargo), exact or latest (Go).

**Symbol resolution**
- **npm → `ts-introspect`** (`POST /symbols {pkg, version, symbols[]}`, 5 s).
  1. **Fetch the package:** version doc → tarball URL and `unpackedSize`. If ≤ `NPM_TARBALL_MAX_BYTES=10 MiB`, download it once and gunzip + untar in memory, keeping `*.d.ts|*.d.mts|*.d.cts|package.json`. Otherwise use the jsDelivr flat list plus per-file fetches (≤ 200). Measured: date-fns per-file took 9.4 s, versus 0.99 s for the tarball.
  2. **Find the types entry:** `exports` conditions (types › import.types › require.types › default; subpaths too) → `typesVersions` → `types`/`typings` → `index.d.ts`. Fallback: `@types/<mangled>`, same major.minor.
  3. **Load dependencies:** bare-specifier imports as dependency types, depth ≤ 2, ≤ 8 packages. The real TS lib files come from disk.
  4. **Walk the checker:**
     - `getExportsOfModule`, `export =` via `resolveExternalModuleSymbol`, `getAliasedSymbol`;
     - **namespace re-exports: when the aliased symbol is a module, recurse** (fixes zod `z.string`);
     - default-instance fallback (`axios.get`);
     - classes and interfaces via `getDeclaredTypeOfSymbol` → `getProperty`.
  5. **An `any`/error hop from an unresolved import gives `unknown`, never `no`.**
  6. **Output:** signatures via `typeToString` + call signatures (overloads ≤ 5); suggestions by Levenshtein over siblings. LRU of 8 Programs.
- **Python** (`symbols/python/`).
  1. **Pick a file:** version JSON → a wheel (`py3-none-any` › `cp313-manylinux*_x86_64` › any). No wheel → the `types-{name}` stub wheel → else `unknown`.
  2. **Range-read the tail:** `bytes=-65536` (`WHEEL_TAIL_BYTES`; measured 0.55–1.0 s, 206 confirmed). Find the EOCD `0x06054b50` plus the ZIP64 locator. If the central directory lies outside the tail, fetch its exact range.
  3. **Map modules:** parse the CD entries into a module map (`.pyi` preferred over `.py`). Import names come from `.dist-info/top_level.txt` or the top-level dirs. The CD is cached forever by wheel sha256.
  4. **Read one module:** range `[off, off+30+len(name)+LOCAL_HEADER_SLACK=1024+csize]` → parse the local header (re-read if short) → `zlib.decompressobj(-15)`. Coalesce ranges within `RANGE_COALESCE_GAP=256 KiB`.
  5. **Build the `ast` index** (in a thread):
     - Class/Function/AsyncFunction defs, Assign/AnnAssign/TypeAlias; `if TYPE_CHECKING` and `try` bodies flattened.
     - `ImportFrom` re-exports followed to depth ≤ `REEXPORT_MAX_DEPTH=4`; `import *` via `__all__`.
     - Class members include in-package bases (depth 3).
     - A module `__getattr__` or an unresolvable external base → `unknown`.
     - A compiled `.so` without `.pyi` → `unknown` (`compiled_module_no_stubs`).
     - Signature is `def name(<ast.unparse(args)>) -> <returns>`; `@overload` supported.
  - **stdlib** comes from `typeshed_client` offline, with a `(3,13)` context.
  - Cold path ≈ 1.5 s.
- **Go:** `pkg.go.dev/v1/symbols/{path}?version=` (0.54 s; beta; try `/v1beta/` then `/v1/`, both constants). Fallback: the proxy `@v/{v}.zip` parsed with tree-sitter-go.
- **Rust:**
  - docs.rs `/crate/{c}/{v}/json`, zstd-decoded (cap `RUSTDOC_MAX_DECOMPRESSED_BYTES=64 MiB`), orjson, `RUSTDOC_PARSE_CONCURRENCY=1`.
  - Check `format_version` against `[MIN,MAX]`. Methods come from `index[id].inner.struct|enum|trait → impls → items`.
  - Project the JSON down to `{path: kind, sig}`.
  - 404 → `unknown` (`rustdoc_json_unavailable`).
- **Over budget:** `exists:"unknown"`, `pending:true`, `retry_after_ms=RETRY_AFTER_MS=3000`; `spawn_background` finishes the build and caches it.

**`/check` algorithm**
1. **Parse:** tree-sitter 0.26 (`Parser(Language(tsp.language()))`, `Query(lang, scm)`, `QueryCursor(query).matches(root)`) in a thread.
2. **Queries:**
   - **Python:** import / aliased / from-import statements, attribute calls, `assign = call`.
   - **TS/JS:** import statements, `require()`, `member_expression`, `new` assignments.
   - **Go:** `import_spec`, `selector_expression`.
   - **Rust:** `use_declaration`, `scoped_identifier`.
3. **`bindings.py`:** resolves aliases to module/symbol, with one level of instance inference (`s = requests.Session()` → `s.mount` is checked as `requests.Session.mount`). Relative imports are skipped.
4. **Map imports to packages:**
   - Python stdlib via `sys.stdlib_module_names`;
   - `py_import_map.json` (PIL→pillow, cv2→opencv-python, sklearn→scikit-learn, yaml→PyYAML, bs4→beautifulsoup4, dateutil→python-dateutil, …);
   - Node builtins and the `node:` prefix are skipped;
   - a Go path with no dot is stdlib;
   - Rust `std`/`core`/`alloc` are skipped.
5. **Check:** deduplicate (≤ `MAX_CHECK_TARGETS=60`), fan out package checks, then per-package `symbols` batches, under `CODE_DEADLINE_S`.
6. **Output:** one diagnostic per reference.

### 3.3 live-facts (`/now`)
Every item carries `provenance {sources[], as_of, age_seconds, freshness, agreement, spread_pct?, licence, attribution}`. Shared helpers:
- `consensus.numeric(values, agree_tol, minor_tol, relative)` → median, spread, agreement;
- `consensus.sets(...)` for holidays;
- `freshness.age_business_days(date, calendar)`.

| Endpoint | Request | Algorithm / sources | Result `kind` |
|---|---|---|---|
| `POST /v1/time` | `{zone? \| place? ≤ 100, country?, at? ISO, convert_to? ≤ 10}` | Local `zoneinfo`, pinned **tzdata 2026.4**, `PYTHONTZPATH=""`. `place` is matched against `zone1970.tab` cities with rapidfuzz. Next transition: a `TRANSITION_SCAN_DAYS=730` day-step scan, then bisection. `tzdb_version` from `tzdata.IANA_VERSION`; `tzdb_latest` and `recent_rule_changes` from Redis (daily job, `RECENT_RULE_CHANGE_DAYS=365`), with the seed file as fallback. | `time` |
| `POST /v1/holidays` | `{country, year 1900..2100, subdivision?, calendar?: public\|NYSE\|ECB…}` | In parallel: the `holidays` lib (`financial_holidays("NYSE")`), Nager.Date and OpenHolidays. Merged by date, each holiday with `sources[]`. Agreement is agree / minor_diff / conflict. | `holiday` |
| `POST /v1/business-days` | `{country, subdivision?, calendar, start, end? \| add_days ±3650}` | Local; echoes which calendar was used. | `business_days` |
| `POST /v1/fx` | `{base, quotes ≤ 10, amount?, date?}` | Up to `FX_MAX_PROVIDERS=4` from `FX_PROVIDER_PRIORITY=("ECB","FRED","BOC","BOE","RBA","BOJ")` covering the pair. Per provider in parallel: `rates?base&quotes&providers=X`, plus the blended call and ECB XML as the anchor. Freshness uses each provider's calendar (ECB after 16:00 Europe/Berlin on TARGET days); `stale` when older than `FX_STALE_BUSINESS_DAYS=1`. `FX_AGREE_PCT=0.5`, `FX_MINOR_PCT=1.5`. | `fx_rate` (+ `providers[]`) |
| `POST /v1/weather` | `{lat, lon} \| {place}` | Coordinates rounded to `METNO_COORD_DECIMALS=4`. met.no compact, honouring `Expires`. In the US, also NWS points (30 d) → hourly forecast + alerts. `TEMP_AGREE_C=1.5`, `TEMP_MINOR_C=3.0`. `place` goes through Wikidata `wbsearchentities` + P625. **No Open-Meteo** (non-commercial). | `weather` |
| `POST /v1/fact` | `{subject (QID\|label ≤ 200), property (PID\|alias)}` | Templated SPARQL only. Current = no P582, preferred rank, latest P580/P585. Plus the Wikipedia REST summary. `agreement: single_source`. | `fact` |
| `POST /v1/news` | `{query ≤ 200, since_hours ≤ 72, country?, lang?, limit ≤ 25}` | Local GDELT GKG FTS5 (bm25 × recency) in parallel with live HN Algolia. Dedupe by URL, then `token_set_ratio ≥ 88`. Headline, URL and domain only. | `news_story` |
| `POST /v1/stocks` | `{symbols ≤ 5}` (flag `AKASHI_STOCKS_ENABLED`) | SEC tickers validation → Twelve Data free `/quote` in parallel with Massive Basic prev. Consensus with a semantics note. `market_state` from the NYSE calendar. Licence `"demo-only; not for redistribution"`. | `quote` |
| `POST /v1/jobs` | `{query?, companies? ≤ 20, location?, remote?, salary_min?, currency?, posted_within_days ≤ 90, limit ≤ 50}` | Local FTS5 index only; never fetched live. | `job` |

- **Functional probe:** `POST /v1/time {"zone":"Africa/Casablanca","at":"2026-11-15T18:00:00Z"}` → `$.results[0].utc_offset ^\+00:00$`.

---

## 4. Pricing (the design's original reasoning; **the plan uses 40k / 20k / 10k**)
Beta median is 10,000 and p95 is 50,000; audit A9 warns at or above p95. The portal charges a flat $0.005, so the design proposed cite 45k, code 30k, now 12k. The runbook's lower values keep more margin under p95 and are the ones the plan adopted.

## 5. Worker jobs (APScheduler 3.x, `coalesce=True`, `max_instances=1`, jitter; `/data` volume)
| Job | Schedule | Input | Storage | Size |
|---|---|---|---|---|
| `tzdb_check` | daily 03:10 UTC | IANA `version` + `NEWS` | Redis `now:tzdb:*` | KB |
| `gdelt_ingest` | every 15 min (+2 min) | `lastupdate.txt` → `*.gkg.csv.zip` | `news.db` (WAL, FTS5, prune > `NEWS_RETENTION_HOURS=72`) | ⚠️ 100–200 MB |
| `jobs_ingest` | hourly; each board every `JOB_BOARD_REFRESH_HOURS=6`; concurrency 2 | `data/job_boards.json` (~150 companies) | `jobs.db` FTS5 | ~50 MB |
| `retraction_sync` | daily 04:00 | Crossref retraction-watch-data CSV ⚠️ | `retraction.db` (swap) | ~20 MB |
| `legal_index_build` | manual CLI | CL bulk | `legal.db` | 0.3 GB (Tier A) / +0.6–0.9 GB (Tier B) |
| `toplists_sync` | weekly | npm-high-impact, top-pypi, crates top 1k | `toplists.db` | ~5 MB |
| `code_prewarm` | nightly 02:00, concurrency 4 | top 500 npm / 500 PyPI / 200 crates / 100 Go | Redis | LRU-bounded |
| `providers_sync` | daily | Frankfurter providers/currencies; CAP ReportersMetadata | Redis | KB |
| `sec_tickers_sync` | daily | `company_tickers.json` | Redis hash | ~1 MB |

- Each job writes `worker:job:{name}:last_ok`.
- CLI: `akashi-worker run-once <job>` and `build-legal-index`.

## 6. Performance plan
- **uvicorn:** `--workers 1 --loop uvloop --http httptools --no-server-header --timeout-keep-alive 75`. No `--limit-concurrency`.
  - One worker because the int8 NLI model costs ≈ 300–400 MB per process. The workload is I/O-bound async, and CPU work runs in threads (ORT and zstd release the GIL).
  - Escape hatch: move NLI to its own container and run 2 api workers.
- **Pools:** one client per upstream; HTTP/2 for npm, PyPI, jsDelivr and Crossref ⚠️ (verify). The prototype lost ≈ 1.7 s to new connections.
- **Warm-up before listening:**
  - import eyecite and run one parse (the import takes 3.7 s);
  - ORT session plus a dummy batch;
  - tree-sitter parsers and queries;
  - top lists;
  - SQLite indexes;
  - clients, plus background TLS pre-connects.

**Expected latency (p50 / p95)**
| Endpoint | Cold | Warm |
|---|---|---|
| cite/verify, 1 DOI | 1.5 / 3.5 s | 30 ms |
| cite/verify, 10 mixed | 2.5 / 6.0 s | < 150 ms |
| cite/verify, legal | 40 ms (CAP cold 0.9 s) | |
| cite/claim | 1.8 / 4.0 s | 350 ms |
| code/package | 0.3 / 1.2 s | 10 ms |
| code/packages ×100 | 0.9 / 2.0 s | |
| code/symbol npm | 0.6 / 2.0 s | |
| code/symbol python | 1.5 / 3.5 s | |
| code/symbol go | 0.6 / 1.5 s | |
| code/symbol rust | 1.0 / 3.0 s | |
| code/check | 2.0 / 6.5 s | 150 ms |
| now/time, business-days | 2 ms | |
| now/holidays | 0.6 / 1.5 s | |
| now/fx | 0.3 / 1.0 s | |
| now/weather | 1.3 / 3.5 s | |
| now/fact | 1.0 / 2.0 s | |
| now/news | 0.7 / 1.6 s | |
| now/jobs | 30 / 80 ms | |
| now/stocks | 0.5 / 1.5 s | |

## 7. Memory and disk (2.7 GiB available, no swap; sum of `mem_limit` ≤ ~2.45 GB)
| Container | Expected RSS | `mem_limit` | Disk |
|---|---|---|---|
| api (Python + eyecite + int8 NLI + tree-sitter + holidays) | 550–650 MB ⚠️ | 768m | image ~0.7 GB (model 244 MB) |
| ts-introspect (Node 24, `--max-old-space-size=192`) | 100–150 MB | 256m | ~150 MB |
| worker | 100–150 MB | 384m | shares `/data` |
| app-redis (`maxmemory 128mb`) | ≤ 140 MB | 160m | — |
| relayer / miner / pocket-redis | ~80 MB | 192m each | pocket-redis volume |
| web | ~150 MB | 320m | GHCR |
| **Total** | **≈ 1.2 GB** | **2,464m** | `/data` 0.5 GB (Tier A) / 1.4 GB (Tier B) |

## 8. Integration checks (not test suites)
**Core**
- `lint_backend.py --card --bad` passes.
- Chunked-body curl works.
- A 70 KB body → 413 JSON; malformed → 400 JSON; wrong path/method → 404/405 JSON.
- `GET /cite` (no slash) → 200 JSON, **not a 307**; `HEAD /cite` → 2xx.
- A Crossref title containing "Timeout" is scrubbed in the first 2 KB.
- Generated schemas validate the captured bodies (Ajv2020 strict + jsonschema).
- `pocket-ap --compare` works.

**cite**
- Varghese 925 F.3d 1339 (11th Cir. 2019) → `not_found` / `page_inside_other_case`.
- Obergefell 576 U.S. 644 joined with Varghese by `;` → Obergefell still gets year 2015.
- Wakefield DOI 10.1016/S0140-6736(97)11096-0 → `retracted`, 2010-02-06.
- 10.1038/nature14539 → `verified`; the same with a wrong year → `mismatch`.
- An invented title → `not_found`.
- arXiv 1706.03762 → verified via DataCite.
- "N Engl J Med 2020;383:2603" → PMID 33301246.
- The 3 NLI pairs; int8 vs fp32 on ~50 pairs (≥ 95% agreement).
- NYT URL → `blocked`; a dead URL → `dead` + archive.
- SSRF: 169.254.169.254, app-redis:6379 and [::1] → 422.
- Threshold calibration on ~40 real and ~40 fake references (GPTZero NeurIPS list).

**code**
- axios@1.7.9: `AxiosInstance.fetchJson` → no; `getUri` → yes, `(config?: AxiosRequestConfig<any>) => string`.
- zod `z.string` → yes; express.Router via @types → yes.
- react-codeshift → placeholder; npm huggingface-cli → placeholder.
- `left-padx` → does_not_exist + likely_typo_of left-pad; PyPI `requestz-ultra` → does_not_exist.
- requests 2.32.3: `Session.mount` → yes, `mountx` → no.
- numpy `linalg.norm` → yes; pandas 2.2.3 `DataFrame.to_markdown` → signature.
- gin v1.10.0 `Context.AbortWithError` → signature.
- anyhow 1.0.86 → `unknown`.
- next@15.1.0 → pending, then warm.
- `os.path.joinx` → no.
- A mixed Python snippet gets correct positions.

**now**
- Casablanca 2026-09-29T03:36Z → +00:00; Edmonton 2026-11-15T18:00Z → −06; Vancouver → −07; Inuvik → −06; tzdb 2026d.
- USD→EUR: ECB / FRED / BOC with FRED stale.
- US July 4 2026 observed on 07-03; NYSE vs federal differ.
- DE Augsburg → minor_diff.
- NYC weather: met.no + NWS agree; Berlin → single_source.
- AAPL prev close cross-check; jobs "Stripe engineer"; US head of state.
- GDELT row counts / `news.db` size after 24 h.
- **Memory:** `docker stats` under 20 concurrent `/check` + `/claim` requests.

## 9. Implementation order
**Core (S1)**
1. uv workspace, ruff, pyright.
2. Constants and settings.
3. Contract, errors and handlers, the response class with the Tier-3 guard.
4. Body limit and context middleware; structlog; metrics.
5. App factory, probes, root mounts; bare prefixes with `redirect_slashes=False`.
6. HTTP registry, client, stamina, `limits`, SSRF.
7. cashews, keys, TTL, codec, singleflight, fan_out.
8. SQLite manager.
9. Schema CLI.
10. Dockerfiles (non-root, `uv sync --frozen`, pinned tzdata, `PYTHONTZPATH=""`, NLI model baked in), `mem_limit`s, deploy, lint.

**code (S3)**
1. Models.
2. npm and PyPI → `/package`.
3. Top lists, then placeholder / typosquat / suspicious.
4. Other registries, deps.dev, `/packages`, `/versions`.
5. Python zip-range reads + ast + re-exports + typeshed.
6. Go.
7. Rust.
8. ts-introspect (TS 6.0.3), then the npm resolver.
9. `/symbol(s)` + pending.
10. `/check`.
11. Pre-warm, probe, schema, checks.

**cite (S4)**
1. Models, the input router, idutils.
2. doi handle + RA + Crossref/DataCite → diff.
3. Retraction overlay + RW DB job.
4. Biblio scoring + OpenAlex + ecitmatch.
5. eyecite + `legal.db` (Mac build → upload) + CAP + statutes.
6. Web: SSRF + metadata + Wayback + `citation_doi`.
7. NLI: bake the model, `/claim`, int8 validation.
8. Deadlines and partials, probe, schema, calibration.

**now (S5)**
1. Time (tz, transitions, tzdb job + NEWS).
2. Holidays and business days.
3. FX.
4. Weather.
5. Wikidata facts.
6. News.
7. Stocks (flag).
8. Jobs.
9. Probe, schema, checks.

**Still to verify:**
- relayer health-check path join (**confirmed from source by the runbook agent**);
- FastAPI HEAD handling;
- stamina with httpx2;
- cashews `suppress`/timeout parameter names;
- PyPI project-status field;
- Xenova `token_type_ids`;
- CL bulk and RW licences;
- Twelve Data free limits;
- h2 support per host;
- `df -h` on the server;
- api RSS with NLI loaded.
