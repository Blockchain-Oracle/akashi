# Akashi 証

> Every tool your agent needs, one wallet, paid per call. Each run travels over Pocket Network.

Akashi is a tool router for AI agents: **70 endpoints from 29 providers** (web search, page reading, research papers,
packages, weather, FX, news, jobs, science data and more) behind one base URL and one Pocket service, `tool-router`.
An agent **discovers** a tool and **inspects** it for free, then **runs** it for $0.001–$0.01 paid in USDC over x402.
No account, no API key: the payment is the credential. Every paid run is delivered as a real Pocket relay through
Akashi's own supplier, and a run that fails is never charged.

Built for the Pocket Network Agentic Services Hackathon (deadline 2026-10-12).

## Live (temporary hosts until the domain is registered)

| What | URL |
|---|---|
| Web: landing, tool catalog, `/agent` chat | https://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io |
| Gateway: API, x402 seller, remote MCP at `/mcp` | https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io |
| Docs | https://k7ds7ucqsnaxw5lorj8a9buu.84.46.247.92.sslip.io |
| Pocket supplier endpoint (RelayMiner) | https://relay.84.46.247.92.sslip.io |

## How a run works

```
agent / chat / CLI / MCP
  │  POST /v1/run/{provider}/{endpoint}  →  402 + PAYMENT-REQUIRED (exact price, Base Sepolia USDC)
  │  retry with PAYMENT-SIGNATURE (EIP-3009 authorization, signed by the agent's wallet)
  ▼
akashi-gateway (Hono + @x402/hono)   free: /v1/catalog /v1/discover /v1/inspect /mcp
  │  verify payment → forward as a signed Pocket relay → settle only if the run succeeded
  ▼
pocket-ap (application key staked for tool-router)
  ▼
HA RelayMiner (relayer + miner + Redis)  ──►  claims and proofs on Pocket Beta
  ▼
akashi-api (FastAPI): validate input → call the provider under a deadline → validate output → size cap → envelope
```

- **One exact x402 route per endpoint**, generated from the catalog with that endpoint's price. No wildcard route can
  run unpaid.
- **Zero charge on failure.** Settlement happens only after a response under 400. Bad input is rejected by a free
  schema pre-check before any payment, and a "nothing found" answer comes back `billable: false` and unsettled.
- **Honest receipts.** Each response carries the Base Sepolia settlement tx, and `via: pocket` or a labelled
  `via: direct` if the relay layer was down. A receipt never claims a relay that didn't happen.
- **Health and ranking are ours.** `discover` is SQLite FTS5 BM25 over agent-written descriptions with synonyms,
  tie-broken by live health (p50/p95 from our own runs) and price.

## Connect an agent

| Way | How |
|---|---|
| **Skill** | Give your agent `<web>/SKILL.md`. It explains discover → inspect → run and the x402 flow. |
| **Remote MCP** | `<gateway>/mcp` (Streamable HTTP): `akashi_discover`, `akashi_inspect`, `akashi_run` (runs paid by Akashi's demo wallet, capped per visitor per day). |
| **Local MCP / CLI** | `curl -O <web>/akashi.mjs && AKASHI_PRIVATE_KEY=0x… node akashi.mjs mcp`, a stdio MCP that pays from your own key with per-call and per-session caps. |
| **HTTP** | `POST /v1/discover {"query": "…"}` → `POST /v1/inspect {"id": "…"}` → `POST /v1/run/{id}` with any x402 client. |

```bash
node akashi.mjs discover "summarize a web page"
node akashi.mjs inspect firecrawl/scrape
node akashi.mjs run wikipedia/summary --input '{"title":"Alan Turing"}'
```

## Proof on chain (Beta, 2026-10-07)

| Step | Reference |
|---|---|
| `tool-router` registered (CUPR 20,000 = 800 uPOKT/relay) | `A96AAAB2B2BA81723ABB3C74BF10C7B79A7D55F07992D7F2F365B51D2AFE67F7` (h 711952) |
| Supplier staked (60,000 POKT) | `E8997D51009D84EE42FFB9B69F0905C55AD4762ABD02F60645634784B97D4915` (h 712494) |
| First x402-paid run, relayed over Pocket | Base Sepolia `0xb544a3a445ed90c0a4d23794c63f6524723ea986628f5abac15b286c63c0a32b` |
| Relay claim (MsgCreateClaim) | `AC215AB4282193BDE42DD2EA99E419C0E489F17594371D64988A89F3F9A3E244` (h 712535) |
| Proof (MsgSubmitProof) | `6729C253844DF7CF7FEF9BDBD169F09D517067F2C09BF945D7659A4703E06560` (h 712544) |
| Claim settled | 1 relay, 800 uPOKT, 2026-10-07 16:14:50 UTC |
| Service Audit A1–A9 | PASS 9/9 ([`docs/plan/audits/2026-10-07-tool-router.json`](docs/plan/audits/2026-10-07-tool-router.json)) |

Every id, tx and deploy is in [`docs/plan/ids-and-txs.md`](docs/plan/ids-and-txs.md) and
[`docs/plan/acceptance.md`](docs/plan/acceptance.md).

## Repository

| Path | What |
|---|---|
| `packages/tools` | Connector framework (`@tool` decorator, auth, pricing, engine, discover, health) and the connectors. Guide: [`CONNECTORS.md`](packages/tools/CONNECTORS.md) |
| `services/api` | The `tool-router` FastAPI service: catalog, discover, inspect, validate, run |
| `services/gateway` | x402 seller, Pocket relay forwarding, remote MCP |
| `apps/web` | Next.js 16 landing, `/tools` catalog, `/agent` chat (AI SDK 7, wallet pay card, receipts) |
| `apps/docs` | Fumadocs site |
| `apps/cli` | `akashi` CLI and local stdio MCP, bundled to one file |
| `deploy/` | Coolify compose for the RelayMiner and pocket-ap, the service card, stake files |

**Local:** `uv sync --all-packages && pnpm install`, then the API on :8000 (`uv run uvicorn akashi_api.main:app`), the
gateway on :8080 (`pnpm -C services/gateway dev`), the web on :3100. Provider keys go in `.env` (gitignored): Firecrawl,
Groq, Serper, Jina, OpenWeather, IPinfo. Keyless providers work without one. Probe connectors live with
`uv run akashi-tools probe --provider <id>`.

**Gates:** `uv run ruff check . && uv run pyright` · `pnpm lint && pnpm typecheck && pnpm build`.

## Operators

To supply `tool-router` yourself: run the api container (`services/api/Dockerfile`, port 8000) with a Redis
(`REDIS_URL`) and whichever provider keys you hold. Tools without a key are listed as unavailable, never half-run.
Put an HA RelayMiner in front of it with [`deploy/pocket/compose.yaml`](deploy/pocket/compose.yaml) and the relayer
config's `rest` backend pointing at the api root (`http://<api-host>:8000`, no path prefix). Then stake a supplier for
`tool-router` with an https endpoint (template: [`deploy/pocket/supplier-stake.yaml`](deploy/pocket/supplier-stake.yaml)).
The card's identity probe is `GET /v1/version` → `{"service": "tool-router"}`.

## Notes

- Testnet only: Base Sepolia USDC and Pocket Beta. Some providers' terms limit reselling their API, so those stay on
  testnet until the provider consents (see `docs/outreach/`).
- Working on this repo? Start at [`docs/plan/STATUS.md`](docs/plan/STATUS.md).
