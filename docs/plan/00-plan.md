# Plan — Akashi 証: verification services for Pocket's Agentic Portal

## 1. Context
Pocket Network's **Agentic Services Hackathon**:
- **Deadline:** 2026-10-12 23:59 EST.
- **Judging:** Uniqueness, Usefulness, Technical complexity and Market appeal, 5 points each.
- **What it asks for:** services that agents use through the Agentic Portal (agents pay per call with x402 or MPP), deployed on Pocket **Beta TestNet**.
- **Submission:** a Google Form per service: name, testnet service ID, endpoint URL, test transaction ID, repo, judge instructions, category.

The research in `context/` (fact-checked) and `plan/` shows three things:
- agents **fail silently** (invented citations, invented packages and APIs, stale facts stated fluently);
- nothing on Pocket addresses this;
- competitors ship bare READMEs with no UI.

**Product:** the brand **Akashi 証 ("proof")**. It answers one question: *"Is this real, and is it current?"* It ships as three Pocket services, one form submission each:

| On-chain ID (capability-named, per Pocket guidance) | On-chain name (ASCII only) | Internal prefix | Category on form |
|---|---|---|---|
| `citation-verify` | Akashi Citation Verifier | `/cite` | Research tool |
| `code-reality-check` | Akashi Code Reality Check | `/code` | Utility Service |
| `live-facts` | Akashi Live Facts | `/now` | Data service |

All three IDs are free on Beta and Main (Pocket MCP `check_service_id`, 2026-09-29). Re-check right before registering, because IDs are permanent.

Around the services we build:
- a web app: landing page, three playgrounds (free demo + "Pay via Pocket"), agent chat demo, status page;
- a separate docs site;
- a Claude agent skill.

Everything deploys on the user's Coolify server.

### User rules (binding; also saved in memory)
- **Goal:** win, not earn. **Free data sources only** (no paid plans).
- **Tests are not a deliverable.** Only integration checks where I'm unsure. Never UI tests.
- **UI is built from curated 21st.dev components** (skills `21st-cli-use`, `21st-ui-build`, `21st-ui-review`). No mediocre design.
- **Read official docs (Context7) before using a tool.**
- **Code quality:** constants, never magic numbers. Reusable code, clean structure, files ≤ 400 lines.
- **The plan survives context clears** (the `docs/plan/` system below).
- **Deadlines never justify a mediocre choice.**
- **Autonomy (D-010, supersedes the earlier rule):** deploys, server config and Beta testnet txs are pre-approved. Confirm only destructive or real-money actions.

## 2. Locked decisions
| Area | Decision | Evidence |
|---|---|---|
| Hosting | User's **Coolify 4.3.23** on Contabo: 4 vCPU, 7.8 GiB RAM, **2.7 GiB available, no swap** (live `free -h`). Traefik v3.6 with Let's Encrypt HTTP-01. Deploy-key git source, no GitHub App. Dashboard reached through `ssh -f -N -L 8001:localhost:8000 agari-box`. Deploy with `coolify deploy uuid`. | Coolify research |
| Domain | **User buys a new domain.** Hosts: `relay-beta.<d>` (Pocket relayer), `api.<d>`, `<d>` or `akashi.<d>` (web), `docs.<d>`. DNS A records point at the Contabo IP, DNS-only (not proxied). **Needed before S2.** | user |
| Backend | Python 3.13 · FastAPI 0.141 + uvicorn[standard] (1 worker, no `--limit-concurrency`) · Pydantic 2.13 · **httpx2** (maintained httpx fork) · stamina · cashews (bytes codec) · pydantic-settings (`AKASHI_`) · structlog · prometheus on a separate port · uv workspace · ruff + pyright | backend research |
| Domain libraries | eyecite, rapidfuzz, idutils · onnxruntime + tokenizers (DeBERTa-v3-base-mnli-fever-anli **int8**, 223 MB) · tree-sitter 0.26 + grammars · packaging, semantic_version, typeshed-client · zstandard · tzdata **2026.4 (= IANA 2026d)** with `PYTHONTZPATH=""` · holidays 0.105 · APScheduler 3.x worker | backend research |
| TS sidecar | `ts-introspect` (Node 24) on **TypeScript 6.0.3 pinned**. TS 7 is the native Go compiler and lacks the classic Compiler API. | backend design |
| Web | Next.js 16 (App Router, standalone, **built in GitHub Actions → GHCR**) · Tailwind 4 · shadcn · **21st.dev** · motion · shiki · CodeMirror 6 · AI SDK 7 + AI Elements · wagmi **2.19.5** + RainbowKit 2.2.11 + viem · @x402/* **2.27.0** pinned together · openapi-typescript + openapi-fetch · pnpm + turbo | frontend research |
| Docs | **Separate `apps/docs`** app: fumadocs 16 (`@fumadocs/base-ui`), fumadocs-openapi, `llms.txt`, at `docs.<d>`. Same pattern as the user's stocklana and open-serv `docs-site/`. | web design |
| LLM | Copy stocklana's `resolveModel` (`/Users/abu/dev/hackathon/stocklana/packages/brain/src/model.ts`): `AI_MODEL=openai/<model>` with the user's `OPENAI_API_KEY`, and `AI_GATEWAY_API_KEY` as fallback | user |
| Data | Free only. Stocks: Twelve Data free + Massive free, **labelled demo-grade, behind a flag**. News: GDELT raw files + Hacker News. Legal: CourtListener **bulk** index (a live token is only 125/day) + CAP static | user + research |
| Pricing (CUPR) | citation-verify **40,000**, code-reality-check **20,000**, live-facts **10,000**. All under the Beta p95 (50k), where audit A9 warns. The portal charges agents a flat $0.005 regardless. | deploy runbook |
| Payments | **Free demo:** web → `/api/demo` → backend, rate-limited. **Pay via Pocket:** browser wallet → same-origin `/api/pocket` proxy (the portal blocks CORS, verified) → `test.agent.pocket.network`. **Fallback while we're unlisted:** `literature-search` (confirmed on the test portal). | research |

**Resources, honestly.** My earlier "~1.5 GB" figure quoted Pocket's container *caps*. Measured idle use is relayer ~31, miner ~35 and redis ~6 MB. The expected total RSS is **≈1.2 GB**, and the `mem_limit` sum is ≈2.46 GB, so it fits in the 2.7 GiB available with no server change. A swapfile is optional and needs an **[OK?]**. `df -h` must be checked before the legal index is uploaded.

## 2b. UI & UX (direction chosen by the user: **"Evidence desk", product-first, light default**)
**Process** (21st skills, as the user requires):
- **21st-ui-explore → 21st-ui-build → 21st-ui-review** on every surface.
- **Generation is disabled on the account (paid tier)**, so the workflow is `21st search` → view previews → `21st get` (read the code) → `21st add` → **re-tokenize** → compose.
- `apps/web/.21st/design.json` records must/avoid rules and `D-` decisions per surface and breakpoint (stocklana format).
- Every surface is verified with `21st review <path>`, chrome-devtools screenshots at 375/768/1280 in light and dark, Lighthouse, keyboard and reduced-motion passes.

The shortlist below came from visually reviewing **~190 real 21st previews** (contact sheets) plus reading each pick's code. `21st get` found hard-coded colours in 29978 (18), 29478 (23) and 919 (41). **Every adopted component is re-tokenized. `framer-motion` imports are standardized to `motion/react`.**

### Brand system (`packages/brand`, `.21st/design.json`)
- **Mark:** a square 角印 **証** seal (hairline double frame, one indigo check stroke). No round hanko, brush fonts or kanji watermarks.
- **Type:** Newsreader (display serif) · IBM Plex Sans (UI) · IBM Plex Mono (data, verdict codes, `as_of`, IDs) · Shippori Mincho B1 (the 証 mark only).
- **Colour:** washi-paper light default, sumi dark. **藍 indigo is the only accent**, used for interaction and brand only.
  - Verdict tokens: 青磁 verified · 琥珀 mismatch · 朱 not_found · 紅 retracted · 藤 ambiguous · grey unverifiable/unknown.
  - **Verdicts are always glyph + word + colour.** oklch values live in `specs/web.md` §2.
- **Motion:**
  - state changes only, 150–240 ms;
  - the signature **seal press** (scale 1.06 → 1 + ink bloom) when a verdict lands;
  - Task-Steps ticks while evidence arrives;
  - ambient motion pauses off-screen;
  - `prefers-reduced-motion` gives cross-fades only.

### Routes
`/` desk + story · `/play/{cite,code,now}` deep playgrounds · `/agent` chat demo · `/status` live proof (probes, listing, claim txs) · `docs.<d>` fumadocs.

### The Evidence desk (`/`), the centrepiece
1. **Hero:** Newsreader headline "Is this real, *and is it current?*" over **one auto-growing input** ("Paste a citation, code, or ask a fact…").
   - References: layout of 19080 Search Hero; `useAutoResizeTextarea` 1097; chips and counter from AI Suggestions 20132, with a byte counter against `MAX_REQUEST_BYTES`.
   - **Example chips** (real cases): *Varghese v. China Southern…* · *Wakefield 1998 (Lancet)* · `axios.fetchJson()` · `import reqeusts` · *Time in Casablanca* · *USD→BRL, how fresh?*
   - ⌘Enter submits, ⌘K focuses, Esc clears.
   - A **live "detected: citation / code / question" chip** updates as you type (override via Segmented Tabs 26923: Auto · Cite · Code · Now).
2. **Routing** (`features/desk/route.ts`), deterministic first:
   - DOI / arXiv / PMID / URL / eyecite-style legal pattern / bibliography shape → cite;
   - import / require / def / `=>` / braces density → code, with language detection;
   - otherwise → now.
   - **Now questions** go through an LLM with structured output (AI SDK `generateObject` via `resolveModel`, OpenAI key) → `{endpoint, params}`, validated by zod. The fallback is Now's kind picker plus forms.
   - **Ambiguous input** shows the Question Tool 12421 picker ("Is this a citation or code?").
3. **Running:** a **Task Steps 23569** trace with mono timings, e.g. `routed → citation-verify 0.0s · Crossref 0.4s · OpenAlex 0.6s · Retraction Watch 0.1s · matching 0.02s`.
   - Rows come from the response's `sources[].latency_ms`. They are shimmer rows until then (Skeleton 19999).
4. **Results stream per item:** `/api/desk` fans a multi-citation or multi-package request out into per-item backend calls and streams NDJSON, so each evidence card **lands with a seal press as it resolves**. Pay-via-Pocket mode sends a single batched call instead: one payment.
   - **Summary bar:** Verdict Stack 29478, re-tokenized (e.g. 3 verified · 1 not_found · 1 unverifiable).
   - **Evidence column:** one card per item:
     - verdict chip (Pill 1600 / Status Badge 521);
     - matched record (Citation 19314 style);
     - field diffs (File Diff 23584 as `year 2016 → 2015`);
     - retraction banner;
     - "details" via Accordion 23530 with right-aligned meta.
     - **Code results:** the snippet rendered with gutter markers (Code Block 28281: line highlight + red gutter), signatures shiki-highlighted.
   - **Sources column:** Source Citation Rail 29355 (numbered sources, licence badge, latency, excerpt, link).
   - **Now answers:** big value + unit, freshness chip, agreement meter (segmented; 19521 restyled), and inline source markers (AI Response 23818 + AI Sources 23817).
5. **States:**
   - empty: the example chips (Empty State 1435 pattern);
   - partial: an amber note naming the `unavailable` sources, never an error;
   - error: Alert 11331 with a mono `code` and Retry only when `retryable`;
   - rate-limited: Upstash Ratelimit 29280 ("18 / 20 free checks · resets in 12:31") with a CTA to **Pay via Pocket**.
6. **Mode toggle** (Segmented Tabs 26923): **Free demo · Pay via Pocket**. Paid mode lazy-loads RainbowKit + the x402 signer, then shows the **Receipt Printer 31601** slip (amount, network, tx → Sepolia Basescan) plus an envelope drawer (JSON Viewer 28477).
7. **Below the fold, the story:**
   - "Agents fail fluently": evidence tiles with Number Ticker 19063 (mono).
   - **How it connects:** Animated Beam 919, re-tokenized. Agent → Portal (402 → pay) → Pocket relay → Akashi → envelope.
   - **Three services:** Bento 9594 adapted to light; each tile deep-links to `/play/*`.
   - **The contract:** JSON Viewer 28477 + Schema Viewer 29970 showing the real envelope and outputSchema.
   - **Pricing:** Receipt Tiers 29978 "Straight" variant, single slip, `1 verification ..... $0.005`, 証 as the rubber stamp.
   - Also: a sources logo strip (21470 monochrome), the CTA with docs and MCP cards (19355), and the footer (7264).
8. **Responsive:**
   - ≥ 1100 px: evidence and sources side by side.
   - 761–1099 px: sources collapse under each card as a row.
   - ≤ 760 px: single column; sources behind "N sources"; the input stays pinned at the top after the first run.
   - Every breakpoint decision is recorded as a `D-` entry in `design.json`.

### Deep playgrounds (`/play/*`)
Same result components as the desk, plus the controls each service needs:
- **Cite:** structured fields and a claim-check panel.
- **Code:** **CodeMirror 6** with `@codemirror/lint` diagnostics, line tints and gutter glyphs, a findings panel synced to lines (click to scroll and flash), and a version-pins row plus a Lookup tab.
- **Now:** a kind picker with a form per endpoint.

Presets are shareable via the URL (`?preset=varghese`).

### Agent chat (`/agent`)
- **Components:**
  - Chat Panel 23601 layout (tool steps inline with timings);
  - AI Tool Call 23789 compact rows (completed / running / failed + meta), expanding to 20078 (input and output);
  - Prompt Input 1740 and Prompt Suggestion 1747, built on AI Elements primitives.
- **Tool outputs reuse the desk's evidence cards** (compact variant) plus **receipt chips**.
- **Budget sidebar:** Upstash Ratelimit 29280 style.
- **Suggestions:** Varghese brief · Wakefield summary · axios review · react-codeshift · Casablanca meeting · USD→BRL · the all-three README prompt.

### Docs (`docs.<d>`, separate app, **Fumadocs**, same as the user's other repos)
- `@fumadocs/base-ui` themed from `packages/brand` tokens (same fonts, indigo accent, verdict colours).
- **Home:** the 証 seal and "Quickstart in 3 minutes" cards.
- **MDX components:** Tabs (curl / TypeScript / Python), Steps, Cards, Callouts, TypeTable for request fields.
- **fumadocs-openapi** reference per service (Scalar "Try it" pointed at the free demo), a **judges page**, and `llms.txt` / `llms-full.txt` / raw pages.
- OG images per page; Orama search (⌘K).

## 3. Architecture
```
Agent (x402/MPP) ─► Agentic Portal (test.agent.pocket.network) ─► gateway relay ─┐
Claude/Cursor ─► @pocket-network/agentic-portal-mcp ──────────────────────────────┤
Web /api/pocket (browser wallet) ─────────────────────────────────────────────────┘
                                                                                   ▼
Coolify project "akashi" (Traefik HTTPS)
 pocket  [compose] relayer ◄─ https://relay-beta.<d>   miner   pocket-redis (8.10.1 noeviction, volume)
         relayer rest backends: citation-verify → http://api.internal:8000/cite
                                code-reality-check → …/code   live-facts → …/now
 api     [Dockerfile] FastAPI: /cite /code /now sub-apps (+ /demo via shared secret) ─► ts-introspect [Dockerfile]
 worker  [Dockerfile] APScheduler: GDELT, jobs boards, retraction DB, top lists, pre-warm, tzdb check → /data volume
 app-redis [one-click] allkeys-lru 128 MB (cache, rate limits, spend caps). NEVER shared with pocket-redis
 web     [GHCR image] Next.js  ◄─ https://<d>        docs [GHCR image] fumadocs ◄─ https://docs.<d>
```
**Path contract.** Gateways send `/v1/...` with no prefix. The relayer joins its backend URL path onto that, and does the same for health checks (`relayer/healthcheck.go:538`). So:
- per-service OpenAPI, cards, probes and examples all use `/v1/...`;
- FastAPI answers bare `GET/HEAD /cite|/code|/now` with 200 JSON (`redirect_slashes=False`, no 307).

**One supplier stake** (≥ 59,500 POKT) serves all three IDs. There is **one test app per service**, because an app stake covers exactly one service.

## 4. Repo layout: `/Users/abu/dev/hackathon/portnetwork/akashi/`
```
README.md                       project readme; its "Working on this repo" section points to docs/plan/STATUS.md (no CLAUDE.md, per user)
docs/plan/                      ← session-survival system (mirrors stocklana)
  00-plan.md                    this plan, verbatim; changes only via decisions.md
  STATUS.md                     single resume pointer (stage, in-flight step, last green commit, blockers, next action)
  decisions.md                  D-### decisions, Q-### open user questions
  acceptance.md                 evidence ledger: every tx, claim, audit run, deploy (UTC, stage, hash, result)
  ids-and-txs.md                accounts, service IDs, CUPR, card sha256, stake/claim txs, Coolify UUIDs, DNS (public values only)
  specs/backend.md  specs/deploy-runbook.md  specs/web.md   the three detailed designs, transcribed in S0
  stage-NN-<slug>.md            checklist + Gate + Findings + Handoff per stage
docs/submission/                form answers per service, judge guide, demo script
brand/                          akashi-mark.svg (角印 square seal + indigo check), wordmark, app icon, X banner, README
cards/<service-id>/             card.json, openapi.json, input-schema.json, output-schema.json, registry.json (portal package)
deploy/pocket/                  compose.yaml, relayer-config.yaml, miner-config.yaml, supplier/app stake YAMLs, pocket-ap YAMLs (NO keys)
deploy/gateway/sage-service.yaml   passthrough snippet for gateway operators
pyproject.toml                  uv workspace
packages/core/  packages/cite/  packages/code/  packages/now/     Python (akashi_core, akashi_cite, akashi_code, akashi_now)
services/api/  services/worker/  services/ts-introspect/
apps/web/  apps/docs/           Next.js apps
packages/api-client/  packages/brand/  packages/model/            TS workspace packages
skill/akashi.skill              Claude skill: when and how agents call Akashi through the portal MCP
.github/workflows/images.yml    web + docs → GHCR (matrix)
```
**Fresh-agent read order:**
1. `docs/plan/STATUS.md` (its header holds the read order, conventions, gate commands and "never trust memory over STATUS.md")
2. the current `stage-NN` file (first unchecked box + Handoff)
3. the last 10 entries in `decisions.md` + any open `Q-`
4. only the spec sections the stage names

Then run `git status && git log -5` before editing. Tick each box in the same commit as the artifact it records.

## 5. Shared backend contract (details in `specs/backend.md`)
- **Envelope, fields in byte order:** `service, operation, version, status(complete|partial), as_of, deadline_ms, elapsed_ms, unavailable[], summary{}, results[], sources[], notes[]`.
  - Every result has a `kind` discriminator, so **one outputSchema per service** covers all its endpoints (the portal registry holds one outputSchema per service).
  - Untrusted upstream text lives only in `results[]`, as `UntrustedStr` scrubbed of gateway trigger words ("timeout", "bad gateway", …).
  - `AkashiJSONResponse` asserts the first 2 KB of every success body is clean.
- **Errors:** always `{error:{code,message,retryable,details}}`.
  - Status codes: 400 `invalid_json`, 404, 405, 413, 422 `invalid_input`, and 500 `internal` (the only 5xx).
  - Upstream failures **never** produce a 5xx. They give `status:"partial"`, and items become `unverifiable`/`unknown` with `retryable:true`.
- **Middleware:** a pure-ASGI 64 KiB body limit (handles chunked requests, which RelayMiner sends with no Content-Length) and a per-request `Deadline` ContextVar.
  - `fan_out` uses `asyncio.wait` plus cancellation, not a TaskGroup.
  - Also `SingleFlight`, and `spawn_background` for "pending" symbol builds.
- **Upstream registry:** one httpx2 client per upstream, with its own concurrency semaphore, rate limit (`limits`, Redis-backed when shared with the worker), timeouts from the deadline, polite UA/mailto, and retries only on idempotent transport/5xx.
  - An SSRF guard covers user-supplied URLs.
- **Cache:** cashews stores bytes (orjson + zstd) under keys `ak:{svc}:{source}:{kind}:v1:{id}`. The TTL table is in the spec; immutable package versions are cached forever.
- **Probes (cheap, local, deterministic; gateways run them every cycle):**
  - `/v1/version` returns `{service:<id>}` and `/v1/health` returns `{status:"ok"}`.
  - Functional probes:
    - citation-verify: `POST /v1/verify` with Obergefell 576 U.S. 644 → `verified` (local legal index);
    - code-reality-check: `POST /v1/symbol` with axios@1.7.9 `AxiosInstance.fetchJson` → `no` (cached forever);
    - live-facts: `POST /v1/time` with Africa/Casablanca at 2026-11-15T18:00Z → `+00:00`.
- **Schema CLI (`akashi-schemas`):** Pydantic → inline `$defs`, strip `title`/`format`/`default`/`additionalProperties:false` → a 2020-12 schema **with `properties`** (so the portal reports `schemaCheck:"passed"`). It is validated against captured bodies (jsonschema + Ajv strict) and also writes a prefix-free `openapi.json` per service.
- **Constants:** every limit, deadline, threshold and TTL lives in `akashi_core/constants/*` or a package's `constants.py`, with a comment citing the source. Examples: `MAX_REQUEST_BYTES=65_536`; `CITE_DEADLINE_S=8.5`; `CODE_DEADLINE_S=7.0`; `NOW_DEADLINE_S=4.0`; `MAX_CITATIONS_PER_REQUEST=10`; `VERIFIED_MIN=0.85`.

## 6. Services (full endpoint and algorithm specs in `specs/backend.md`)
- **citation-verify** `/cite`
  - **Endpoints:**
    - `POST /v1/verify` takes ≤ 10 citations (string or structured).
    - `POST /v1/claim` checks whether a source supports a claim.
  - **Verify pipeline:** classify (idutils/eyecite; split on `;` first to avoid eyecite's year-leak bug). Then per input type:
    - **DOI path:** doi.org handle + registration agency → Crossref or DataCite record, plus OpenAlex, plus the local Retraction Watch DB.
    - **No-DOI path:** Crossref `query.bibliographic` (score floor 40) → OpenAlex fallback, plus PubMed ecitmatch.
    - **Legal path:** eyecite → local CourtListener `legal.db` (the ~300 MB citations table, built on the Mac and uploaded) → CAP static ("page inside another case" catches the fake Varghese citation).
    - **Web path:** SSRF-safe fetch + Wayback; 401/403/429 counts as "blocked", never "dead".
  - **Scoring:** weighted rapidfuzz (title .50 / authors .25 / year .15 / venue .10) → `verified | mismatch | not_found | retracted | ambiguous | unverifiable`, plus field diffs.
  - **Claim path:** premise chain (given text → OpenAlex abstract → Europe PMC → Crossref JATS → page) → int8 ONNX NLI → `supported | contradicted | insufficient_evidence`. Ship only if int8 agrees with fp32 on ≥ 95% of ~50 labelled pairs.
- **code-reality-check** `/code`
  - **Endpoints:** `POST /v1/package(s)` (8 ecosystems), `/v1/symbol(s)` (npm/pypi/go/cargo), `/v1/versions`, and **flagship `/v1/check`** (a snippet in → CodeMirror-ready diagnostics per import and call).
  - **Package verdicts:** `ok | does_not_exist | placeholder | likely_typo | suspicious_new | deprecated | yanked`.
    - Placeholder detection: `0.0.1-security`, "prevent dependency confusion", tiny tarballs.
    - Typo-squat: generator heuristics + Damerau-Levenshtein against top lists; npm-high-impact 17k etc.
  - **Symbol lookup per ecosystem:**
    - **npm:** ts-introspect (tarball ≤ 10 MiB, else jsDelivr; exports/typesVersions/@types; follows namespace re-exports; hitting `any` gives `unknown`).
    - **Python:** wheel HTTP range reads (tail 64 KiB → central directory → one entry) → `ast` index following re-exports; typeshed for stdlib.
    - **Go:** pkg.go.dev symbols API → module zip fallback.
    - **Rust:** docs.rs rustdoc JSON.
  - **Answers are three-valued** (yes / no / unknown). A cold build over budget returns `pending` + `retry_after_ms`, and the build finishes in the background.
  - Vulnerability questions point to Pocket's existing `package-advisories` and `taint-check` (no duplication).
- **live-facts** `/now`
  - **Endpoints:** `/v1/time`, `/holidays`, `/business-days`, `/fx`, `/weather`, `/fact`, `/news`, `/stocks` (flagged), `/jobs`.
  - Every answer carries `provenance{sources[], as_of, age_seconds, freshness, agreement, spread_pct, licence, attribution}`.
  - **Sources and method per endpoint:**
    - **Time:** computed locally (pinned tzdb 2026d, with the latest version checked daily).
    - **FX:** separate Frankfurter calls, one per central-bank provider (ECB/FRED/BOC…), plus ECB XML → consensus.
    - **Weather:** MET Norway (+ NWS in the US).
    - **Facts:** templated Wikidata SPARQL (current = no end time, preferred rank).
    - **News:** local GDELT FTS + HN.
    - **Jobs:** local index only (Greenhouse/Lever/Ashby, refreshed every 6 h).

## 7. Stages (each gets `docs/plan/stage-NN-*.md` with checkboxes, a Gate, Findings and a Handoff)

**S0 Bootstrap**
- **Steps:**
  1. **First, transcribe the three detailed designs from this planning session into `docs/plan/specs/{backend,deploy-runbook,web}.md`**, plus this plan into `00-plan.md`, before anything else, so a context clear loses nothing. Also copy the 21st research into `docs/plan/specs/ui-shortlist/`: `catalog.json`, the contact sheets, and the per-surface pick table with IDs, why each was picked, its dependencies and its hard-coded-colour count. It currently lives in the session scratchpad.
  2. Tooling: `git init`, uv workspace, pnpm + turbo, ruff/pyright/biome, `.env.example` per app, `.gitignore` (keys, `.env*`). Install Pocket's official **Service Builder skill** (`pocket-service-builder.skill`) into Claude Code alongside the Pocket MCP.
  0. Delete `/Users/abu/dev/hackathon/portnetwork/CLAUDE.md` (created earlier this session; the user doesn't use CLAUDE.md) and save that preference to memory.
  3. Create STATUS.md, decisions.md, acceptance.md and ids-and-txs.md. **No CLAUDE.md or AGENTS.md** (user rule); set `agentRules: false` in `next.config.ts` so Next 16 does not generate them.
  4. **[OK?]** Create the private GitHub repo and the Coolify project `akashi` with a deploy key.
- **Gate:** the workspaces install and the plan files are committed.

**S1 Core backend**
- **Steps:**
  1. Build `packages/core`: contract, handlers, middleware, deadline/fan-out, HTTP registry, cache, sqlite reader, schema CLI, obs, constants.
  2. `services/api` with stub routers + probes.
  3. Dockerfiles for api / ts-introspect / worker.
  4. **[OK?]** Deploy app-redis, api and ts-introspect on Coolify.
- **Gate:** `lint_backend.py --card --bad` passes; the chunked curl works; 413/400/404/405 all return JSON; `GET /cite` returns 200, not a 307.

**S2 Pocket plumbing** (slow on-chain steps come early). Runbook: `specs/deploy-runbook.md`.
- **Steps:**
  1. Install pocketd (pinned) and pocket-ap. Create keys: owner, operator and 3 apps (`--keyring-backend test`, Beta only; mnemonics go in the user's password manager).
  2. **[OK?]** Web faucet claim(s), then bank sends: operator 62k, apps 1.2k each, and the operator's pubkey tx.
  3. Cards v1 (stub-capable probes): `validate_card.py` + `pocketd tx service validate-card`.
  4. **[OK?]** 3 × `add-service <id> "<Name>" <cupr> --card-file` (positional syntax, 3,000 POKT).
  5. **[OK?]** Buy the domain and set DNS.
  6. **[OK?]** Create `/opt/pocket/secrets/supplier-keys.yaml` (0400, uid 1000) over SSH.
  7. **[OK?]** Deploy the `pocket` compose (predefined network ON, preserve repo ON, auto-deploy OFF).
  8. Verify on the server: `/ready/<id>`, redis `noeviction`, a 400 plus an LE certificate at `relay-beta.<d>`.
  9. **[OK?]** `stake-supplier`, signed by the operator, 60,500 POKT, all 3 services.
  10. **[OK?]** 3 × `stake-application` (1,100 POKT each).
  11. pocket-ap relays per service, each in a different session. Wait ≈ 45 min, then fetch the claim txs from the indexer GraphQL and record them. Run the audit API for all 3.
  12. **Contact the organizers (Discord + directors@/portal@pokt.foundation):**
      - staging app and test portal listing process;
      - gateway delegation;
      - whether the test tx should be the claim tx;
      - one endpoint for 3 submissions;
      - SAGE passthrough.
- **Gate:** a settled claim per service and audit A1–A7 PASS.

**S3 code-reality-check**
- **Steps:**
  1. npm/PyPI adapters → `/package`.
  2. Top lists (worker) + placeholder / typosquat / suspicious_new.
  3. Other registries + deps.dev + `/packages` + `/versions`.
  4. Python wheel range reads + AST.
  5. Go.
  6. Rust.
  7. ts-introspect (TS 6.0.3).
  8. `/symbol(s)` with pending.
  9. `/check` via tree-sitter.
  10. Pre-warm job, schema, probe.
- **Gate:**
  - axios `fetchJson` → no, and `getUri` → yes + signature.
  - zod `z.string` → yes.
  - react-codeshift and huggingface-cli → placeholder.
  - `left-padx` → likely_typo.
  - requests `Session.mount` → yes.
  - gin `Context.AbortWithError` → signature.
  - anyhow 1.0.86 → unknown.
  - next@15 → pending, then warm.

**S4 citation-verify**
- **Steps:**
  1. Input router.
  2. DOI/RA/Crossref/DataCite + diffs.
  3. Retraction overlay + RW DB job.
  4. Biblio scoring + OpenAlex + ecitmatch.
  5. eyecite + `legal.db` (built on the Mac; **[OK?]** upload after `df -h`) + CAP.
  6. Web + Wayback + SSRF.
  7. NLI `/claim` + int8 validation.
  8. Batch deadlines, calibration on ~40 real and ~40 fake references, schema, probe.
- **Gate:**
  - Varghese → not_found (page inside another case).
  - Wakefield → retracted (2010-02-06).
  - nature14539 → verified, and with the wrong year → mismatch.
  - arXiv 1706.03762 → verified.
  - The 3 NLI pairs correct.
  - SSRF to 169.254.169.254 → 422.

**S5 live-facts + worker**
- **Steps:**
  1. Time (tzdb job + NEWS parser).
  2. Holidays and business days.
  3. FX consensus.
  4. Weather.
  5. Wikidata facts.
  6. News (GDELT ingest + HN).
  7. Stocks (flag, demo label).
  8. Jobs index.
  9. Probe, schema.
- **Gate:**
  - Casablanca → +00:00 with tzdb 2026d; Edmonton at 2026-11-15 → −06.
  - USD→EUR: ECB, FRED and BOC with FRED flagged stale.
  - NYSE and federal holiday calendars differ.
  - Memory under 20 concurrent requests stays inside the limits.

**S6 Hardening + portal package**
- **Steps:**
  1. Regenerate the schemas.
  2. **[OK?]** Card v2 updates via `add-service` (re-read the live CUPR, always pass the name and CUPR).
  3. Run schemathesis over each OpenAPI (every body is JSON, no 5xx); run `lint_backend.py` for all 3.
  4. Measure latency; audit green.
  5. `cards/<id>/registry.json`: description, methods, inputSchema, outputSchema, example. **Send it to PNF**; publish `sage-service.yaml`.
- **Gate:** audit without FAIL, p95 inside targets.

**S7 Web foundation + brand** (`specs/web.md`)
- **Steps:**
  1. Scaffold `apps/web`, `apps/docs`, `packages/{api-client,brand,model}`.
  2. Brand (square 証 seal, **indigo accent only**, Newsreader / IBM Plex Sans / Plex Mono / Shippori Mincho for the mark only, verdict tokens) and `21st init --design-context` + `.21st/design.json` must/avoid rules.
  3. Env (zod, public/server split) and constants.
  4. Dockerfiles; GHCR workflow; **[OK?]** Coolify Docker-Image resources.
- **Gate:** images in GHCR, health green, `21st review` clean.

**S8 Evidence desk + story** (§2b)
- **Steps:**
  1. `21st add` the shortlisted components in batches → re-tokenize → shared evidence-card kit in `components/evidence/`, like stocklana's desk-kit.
  2. Input + detector + override tabs + example chips.
  3. `route.ts` (deterministic) + the Now LLM router (`generateObject`) + the ambiguity picker.
  4. `/api/desk` NDJSON per-item fan-out.
  5. Task-Steps trace; evidence cards; source rail; verdict-stack summary; every state.
  6. Below-the-fold story sections.
  7. Record breakpoint decisions in `design.json`.
- **Gate:**
  - every example chip routes correctly and lands the expected verdict;
  - `21st review` is clean;
  - Lighthouse mobile: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100;
  - keyboard-only run and reduced-motion run;
  - light and dark screenshots at 375/768/1280, reviewed with the user.

**S9 Playgrounds + Pay via Pocket**
- **Steps:**
  1. Generate the api-client from the per-service OpenAPI.
  2. `/api/demo` (rate limit + JSON 429).
  3. `/play/cite` (verdict cards, field diff, retraction banner, source rail).
  4. `/play/code` (CodeMirror lint diagnostics + findings panel).
  5. `/play/now` (answer card, freshness chip, agreement meter).
  6. `/api/pocket` proxy (allowlisted IDs **and sub-paths**, zod-validated before paying, 64 KiB cap, forwards PAYMENT-* headers).
  7. RainbowKit + x402 browser signer (selector caps as constants) + receipt slip.
  8. Listing flag with the `literature-search` fallback.
- **Gate:**
  - every preset returns its expected verdict;
  - a 429 shows the UI notice;
  - **one real paid call in the browser** → receipt → Sepolia Basescan tx;
  - a 413 and an unknown path are rejected before any 402.

**S10 Docs + agent assets**
- **Steps:**
  1. The fumadocs information architecture (quickstart, **judges page**, per-service guides, OpenAPI reference, x402 TS/curl/mppx, MCP configs, skill, response contract/errors/limits, data sources & licences).
  2. `llms.txt`, `llms-full.txt`, raw pages.
  3. `skill/akashi.skill`.
- **Gate:** docs build with no broken links, every documented curl actually runs, `llms.txt` served.

**S11 Agent chat**
- **Steps:**
  1. `/api/chat`: AI SDK 7 `streamText` (`instructions`, `isStepCount`) with typed tools that mirror the backend. `toModelOutput` passes only the data, as untrusted.
  2. A server demo wallet pays through the portal once we're listed; before that, the direct backend, clearly labelled.
  3. Redis Lua reserve-then-commit spend caps (per day, per IP, per session).
  4. Tool-call cards reuse the playground verdict components, plus receipt chips and the suggested prompts.
- **Gate:** every suggestion works end to end; the session cap trips; injected instructions in tool data are ignored.

**S12 Submit**
- **Steps:**
  1. **[OK?]** Make the repo public.
  2. Spec URLs → raw commit URLs + sha256 (card update).
  3. End-to-end x402 run on the test portal.
  4. Demo video (failure-first style: an agent confidently cites Varghese → Akashi catches it; use the `failure-first-demo-video` skill). Brand assets: X banner, camera backgrounds.
  5. `docs/submission/*` per service.
  6. **The user submits the three forms**, with the claim tx IDs from `ids-and-txs.md`.
- **Gate:** the pre-submit checklist in `specs/deploy-runbook.md` §9.

The order balances dependencies and risk:
- S2's slow chain work starts while S3–S5 are built.
- The web track (S7–S11) can start once the S1 contract and the OpenAPI outputs are stable.

## 8. Reuse, don't rebuild
- **Pocket skill** (`.research/repos/pocket-network-resources/service-builder/unpacked/pocket-service-builder/`):
  - scripts `validate_card.py`, `encode_card.py`, `lint_backend.py`, `audit_services.py`, `check_catalog.py`, `live_params.py`, `query_state.py`;
  - `templates/` (after the KB fixes listed in `specs/deploy-runbook.md`).
- **Pocket MCP** (installed): `check_service_id`, `validate_card`, `card_diff`, `service_status`, `supplier_status`, `session_check`, `claims`, `audit_services`.
- **stocklana:**
  - `packages/brain/src/model.ts` (resolveModel);
  - `web/.21st/design.json` format;
  - the `docs/plan` system.
- **open-serv:**
  - `docs-site/lib/source.ts` and `llms.ts` (fumadocs + llms).
- **KB:**
  - `context/05-external-libs/test-agent-client.md` (x402 pay-call script, mppx one-liner);
  - `context/03-building-a-service/*` (commands, corrected facts).

## 9. Verification (integration checks, no test suites)
- **Per stage:** the gates above.
- **Continuous:**
  - `lint_backend.py`;
  - schemathesis against each `openapi.json`;
  - `pocket-ap call --compare https://api.<d>/<prefix>`;
  - Pocket MCP `service_status`/`claims`;
  - the audit API (`network=beta`);
  - `docker stats` and `free -h` after deploys.
- **End to end:**
  1. An agent (Claude with the portal MCP, or `pay-call.ts`) pays on Base Sepolia through `test.agent.pocket.network`.
  2. The envelope comes back with `schemaCheck:"passed"`.
  3. The claim settles on-chain; the tx is recorded in `acceptance.md`.

## 10. Risks and open items
- **Test portal listing depends on PNF** (the process is unknown) → ask in S2; the `literature-search` fallback flag keeps the demo honest meanwhile.
- **Domain purchase** blocks S2 steps 5 onward.
- **Needs checking on first use:**
  - Coolify internal hostnames under a predefined network (fallback: `redis-<uuid>`, or route the backend via `https://api.<d>`);
  - api RSS with NLI loaded (fallback: fp32 off / a separate nli container);
  - server free disk for the legal index (fallback: Tier A citations only).
- **Unverified library details, to confirm with Context7 before use:**
  - httpx2 + stamina integration;
  - FastAPI HEAD handling;
  - `@x402/evm` browser signer shape;
  - AI SDK 7 API names;
  - Xenova ONNX `token_type_ids`;
  - pkg.go.dev `/v1` vs `/v1beta`.
- **Licences:** CourtListener bulk and Retraction Watch data (confirm); stocks are free but demo-only (labelled + flag).
- **Keys:** `--keyring-backend test` is acceptable for Beta only; never reuse those keys on MainNet.
