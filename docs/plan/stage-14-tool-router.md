# S14 — Akashi Tool Router (Monid direction)

> **Status: proposed 2026-10-07, awaiting the user's approval.** Supersedes S13 (HTTPie UI). Source of truth for the plan until approved; then steps become checkboxes here.


## Context

You found the direction you want: **Monid** (monid.ai, MIT connector repo forked to `Blockchain-Oracle/monid`) — one base URL where an agent **discovers → inspects → runs** thousands of third-party tools and pays per call. We build our own version under the **Akashi** name, **inside the Pocket ecosystem**: every paid run is an x402 USDC payment and is delivered as a **real Pocket relay** through Akashi's own supplier. The fork is reference only (cloned read-only to `.research/repos/monid`); nothing is copied from it as a dependency and it is never updated.

Your answers today: **drop** the three verification services as products (citation-verify, code-reality-check, live-facts); the catalog holds **only tools we serve ourselves** (not the 105 other Pocket portal services); use **your VPS** (static IP 84.46.247.92, the Coolify box) for anything IP-whitelisted; **buy a $2–3 domain** for now.

Facts verified today (2026-10-07):
- **No Akashi domain exists** in your Namecheap account (20 domains listed through a SOCKS tunnel over the VPS; `akashi.xyz` / `akashi.run` are taken). You chose **`useakashi.xyz` ($2.00, renews $21.48)**. The register call stopped before charging: **Namecheap balance is $0.00** and the API pays only from balance. After a top-up I register it (`--contacts-from shijima.xyz`, free WhoisGuard) and add A records `@`, `api`, `docs`, `relay` → 84.46.247.92.
- Service ID **`tool-router`** is free on Beta and MainNet, no look-alikes (`check_service_id`).
- Nothing in Pocket's catalog (113 main / 105 test) is a tool router. Overlaps to avoid duplicating as-is: AgentSearch (search/extract/render), URL Fetch Markdown, Headless Render, Literature Search.
- Monid's open repo has **31 providers / 699 endpoints, all keyed**; `discover` ranking, health and hints are **hosted, not open source** → we build our own.
- Monid's site tokens (read from its CSS): white `#fff`, ink `#1e1e1e`, ink-2 `#4d4d4d`, muted `#6b6b6b`, accent `#0016d7` (hover `#0012b0`, press `#000e8c`), dark `#121212`/`#1e1e1e`, lines `#ebebeb`/`#d6d6d6`, success `#00784b`, radii 4/8/16; **Outfit 600** display (−4% tracking), **Inter** body, **JetBrains Mono** data.
- Your chat/wallet pieces exist but are split across repos: KeeperHub v2 (tool timeline, composer, history, receipt card, AI SDK 7 approval gate), Portaldot (wallet picker, client-signed TransferCard), Masayume (wagmi + RainbowKit), DeepBookie (SignReceipt states that survive reload), Akashi web (chat route, Redis history, sessions — server side only; no `/agent` UI, no wallet, no x402 code yet).
- Pocket's own `agentic-portal-mcp` (MIT) pays per call from a local key with spend limits — the precedent for our MCP/CLI.
- Deadline **2026-10-12 23:59 EST**. The relay-claim tx for the form still needs: domain → RelayMiner → supplier stake → app stake → relays → settled claim (~45 min of chain time).

## What we take from Monid (and what we don't)

| Take | Akashi version |
|---|---|
| Three verbs; discover + inspect free, run paid | `POST /v1/discover`, `/v1/inspect` free; `POST /v1/run/{provider}/{endpoint}` paid via x402 (price per endpoint, see below) |
| Declarative connectors (provider + endpoint, agent-written descriptions, notes) | Python `packages/tools`: `Provider` / `Endpoint` with pydantic input/output models |
| Zero charge when the vendor fails | x402 settles **only** after a successful run; a provider error returns JSON and the payment is never settled |
| Health (`healthy · 4.4s`, p50/p95) + hints | Our own: run metrics in Redis + a scheduled probe; hints from a curated "use instead" graph |
| Skill / MCP / CLI ("three ways to connect") | `/SKILL.md`, remote MCP at `api.<domain>/mcp` + local stdio MCP, `akashi` CLI — all on one TS client |
| Landing, `/tools` catalog, provider pages, endpoint modal, docs nav | Same structure and paint, Akashi words, **our own mark** (not Monid's asterisk or mascot) |
| "One balance" | **One wallet**: the agent's USDC on Base Sepolia; no account, no API key ("payment is the credential", Pocket's phrase) |
| Not taken | Async/long-running tools (video, actors, crawls): Pocket needs sync JSON < ~10 s, body ≤ 64 KiB, no streaming |

## Architecture

```
agent / chat / CLI / MCP
   │ x402 (USDC, Base Sepolia, payTo AKASHI_PAY_TO)
   ▼
akashi-gateway (Hono + @x402/hono)  ── free: /v1/catalog /v1/discover /v1/inspect /mcp /SKILL.md /llms.txt
   │ paid /v1/run: verify → relay → settle only on success
   ▼
pocket-ap serve (app key akashi-app-router, staked for tool-router)
   │ signed Pocket relay
   ▼
HA RelayMiner (relayer + miner + Redis 8.10, relay.<domain>)  ──► claims/proofs on Beta
   ▼
akashi-api (FastAPI): /v1/run executes the connector → upstream (our keys / keyless)
```
- If pocket-ap fails, the gateway may call the api directly, and the receipt says `via: direct` (never claims a relay that did not happen).
- Receipts carry: Base Sepolia settlement tx (Basescan), Pocket session id + supplier (from pocket-ap), and later the claim tx (from the indexer).
- Agents that only speak the Pocket portal can call `tool-router` there once PNF lists it; same backend, no code change.

## Catalog v1 (~70 endpoints, ~30 providers)

The provider research (official pricing + terms pages, 2026-10-07) found that **most paid search/scrape vendors forbid reselling** their API. So v1 uses providers whose terms allow serving output to our users (GREEN) or only ban as-is mirroring (AMBER — our envelope, normalisation, health and provenance are the added value).

| Tier | Providers / endpoints | Cost to you | Terms |
|---|---|---|---|
| **Firecrawl** (key on hand; replaces Perplexity, which has no free tier) | `firecrawl/search` (web/news/images, 1.6 s measured, 2 credits/10 results) · `scrape` (markdown, 2.0 s, 1 credit, capped: a Wikipedia page is 172 KB) · `map` · `ask-page` (scrape `query` format, +4 credits) · `research-papers` / `research-paper` / `related-papers` · `developer-search` (issues, PRs, READMEs, docs) · `gov-search` (US statutes, regulations, opinions) — 0.9–2.3 s measured | Free 1,000 credits/mo (**146 left** until Oct 29); Hobby $16/mo billed yearly = 5,000 | §5.4.1 / §5.4.3 ban commercial resale "except as expressly authorized" → testnet USDC only until they reply to a consent email |
| **Akashi Answer** (ours, composite) | `akashi/answer`: Firecrawl search (top 5 + markdown) → Groq gpt-oss-120b writes a cited answer, ~4–6 s; the Perplexity-style tool, built by us | ~3 credits + ~$0.001 | ours |
| Keyed, free sign-up (no card) | **Groq** (gpt-oss) summarize-url / extract-json / classify (~$0.0003/call, free 1k/day) · **Serper** search / news / scholar / places ($0.001; 2,500 free) · **Jina Reader** (10M free tokens) · **OpenWeather** (free 1M/mo) · **IPinfo Lite** (free, unlimited) | $0 | Serper, Jina AMBER; Groq, OpenWeather, IPinfo GREEN |
| Keys already on hand | OpenAlex (key) · Twelve Data + Massive stocks (flagged demo, D-023) | $0 | — |
| Ask first (I draft the emails, you send) | **Firecrawl** (to move past testnet) and **Exa** (search/contents/answer, $10/mo free credit) — both ban resale without consent | $0 | consent pending |
| Keyless (25) | Wikipedia, Wikidata, OpenAlex, MET Norway, NWS, Frankfurter, GitHub, npm, PyPI, deps.dev, HN Algolia, arXiv, Crossref, Datamuse, dictionaryapi.dev, Nager.Date, Open Food Facts, PubChem, USGS, NASA, World Bank, US Census, Wayback, YouTube oEmbed, DefiLlama | $0 | GREEN / GREEN-ish |
| Reused from today's code | local tz compute (IANA 2026d) · GDELT local news index · 89 ATS job boards · FX cross-check · weather cross-check | $0 | ours |

> **2026-10-07, D-039:** terms no longer exclude a provider (user). The terms-only exclusions below come back when
> keyless or keyed.

**Excluded:** Perplexity (no free tier; you'd prepay credits) · Groq Compound (decommissioned 2026-09-21) · terms forbid it: Brave, Tavily, SerpAPI, TinyFish (free but "internal business purposes" only), PDL, context.dev, ScreenshotOne, Alpha Vantage, CoinGecko, NewsAPI, GNews free, Semantic Scholar, Reddit, Open-Meteo free, Nominatim, Overpass, ip-api, OpenRouter passthrough, YouTube transcripts.

**Pricing per endpoint** (price card in the connector, like Monid's): `$0.001` keyless / local, `$0.005` standard keyed, `$0.01` premium (Firecrawl search/ask-page, Akashi Answer). Upstream cost is never above the price.

Every endpoint declares a **`render` kind** (search_results, answer, page, papers, news, jobs, quote, fx, weather, place, package, table, json) so the chat and the playground draw a proper card.

**Run URL:** `POST /v1/run/{provider}/{endpoint}` with the input as the JSON body (Pocket forwards sub-paths and wants inputs in the body). The gateway's x402 route table is **generated from the catalog**, one exact route per endpoint with its own price — no wildcard route that could run unpaid (the D-038 lesson).

## Repo changes (`akashi/`)

1. **Park the in-flight HTTPie work**: commit the dirty tree to branch `archive/ui-v3-httpie`, return `main` to `42e4d27`.
2. **Retire the three services**: remove `/cite` `/code` `/now` routers, `cards/*`, the desk/story features, their docs pages; delete the `akashi-nli` and `akashi-ts-introspect` Coolify apps (frees ~2.3 GB on the box for the RelayMiner). Keep only library code a connector reuses (`akashi_now` time/fx/weather/news/jobs/stocks modules move under connectors).
3. **`packages/tools` (new, Python)** — `framework/` (`provider.py`, `endpoint.py`, `auth.py` creds injected only in transport, `pricing.py`, `engine.py` validate → build → execute under deadline → map → validate → size cap, `catalog.py` compile to `catalog.json` with JSON Schema, `discover.py` SQLite FTS5 BM25 + category + health tie-break, `health.py` Redis p50/p95 + verdict, `hints.py`) and `connectors/<provider>/{provider.py, endpoints/*.py}`. Reuses `akashi_core.http.client.UpstreamClient` (rate limits, cooldowns, deadline budgets), `akashi_core.contract.envelope`, `akashi_core.cache`, `akashi_core.http.ssrf`.
4. **`services/api`**: one service `tool-router` — `/v1/version` (identity probe), `/v1/health`, `/v1/catalog`, `/v1/discover`, `/v1/inspect`, `/v1/run`; probe task as a Coolify scheduled task.
5. **`services/gateway` (new, Node/Hono)**: x402 seller, pocket-ap forwarding, free routes, remote MCP (`@modelcontextprotocol/sdk` + `@x402/mcp` payment wrapper), demo payer with Redis spend caps.
6. **`packages/client` (new, TS)**: discover/inspect/run + x402 pay-fetch + spend limits (pattern of `agentic-portal-mcp/src/buyer`, `budget.ts`); used by the CLI, the local MCP and the web.
7. **`apps/cli` (new)**: `akashi discover|inspect|run|wallet|mcp` (`mcp` = local stdio server with `AKASHI_PRIVATE_KEY`, `AKASHI_MAX_TOTAL_ATOMIC`).
8. **`apps/web`** (Monid paint, tokens in `packages/brand/tokens/theme.css`): `/` landing (hero + "give this to your agent" copy box, mark with tool orbit + 24 tool tiles, 3 steps, "no subscriptions" stats + live terminal demo, three ways to connect, blue CTA band, FAQ, become a provider, dark footer with giant wordmark); `/tools` (search, category rail, provider cards), `/tools/[provider]` (endpoint cards, inspect modal, Try it); `/agent` chat; `/SKILL.md`, `/llms.txt`.
9. **Chat `/agent`**: server = existing `app/api/chat/route.ts`, `lib/agent/*`, `chat-store-redis.server.ts`, `session.server.ts` with tools `discover`, `inspect` (server) and `run` (pay mode: no `execute` → PayCard; demo mode: demo payer). UI ported: KH `tool-timeline.tsx`, `message-list.tsx`, `composer.tsx`, `chat-home.tsx`, `session-dropdown.tsx`, `receipt-card.tsx`, `write-card-parts.tsx` (TxInset); Portaldot `TransferCard` flow → **PayCard** (awaiting signature → signing → settling → paid / void); DeepBookie `receiptState.ts` + `applyOutcomes.ts`; Masayume `wagmi.ts` / `AppProviders.tsx` / `ConnectButton.tsx` for the RainbowKit modal; one result card per `render` kind. Strip next-intl, keep AI SDK 7.
10. **`apps/docs`** (Monid docs nav): Introduction · Quickstart (Skill, MCP, CLI, HTTP) · Pricing & payments (x402) · How it runs on Pocket · CLI reference · API reference (discover, inspect, run, catalog) · Tools (generated per provider) · Become a provider (connector guide).
11. **Pocket**: card + OpenAPI for `tool-router`; `deploy/pocket/` compose (relayer, miner, Redis 8.10 noeviction, pinned v0.1.0, KB fixes); `deploy/pocket-ap/` config.
12. **Plan docs**: new `docs/plan/stage-14-tool-router.md`, decisions D-039+, STATUS rewritten, `ids-and-txs.md` + `acceptance.md` rows.

## Order (each step leaves lint/typecheck/build green and deployable)

| Day | Steps |
|---|---|
| **Wed 10-07** | Buy domain + DNS (`@`, `api`, `docs`, `relay` → VPS) · park HTTPie branch, retire old services · `packages/tools` framework + first 10 connectors · api `/v1/*` deployed · register `tool-router` · RelayMiner up · supplier + app stakes · first relays → claim |
| **Thu 10-08** | Gateway (x402 + pocket-ap + demo payer) · health + discover ranking · ~40 connectors · landing + `/tools` on Monid paint |
| **Fri 10-09** | `/agent` chat: wallet modal, PayCard, receipt, render cards, history |
| **Sat 10-10** | Docs, SKILL.md, remote + local MCP, CLI · ~70 connectors · audit A1–A9 |
| **Sun 10-11** | Polish, 21st review, Lighthouse, README, submission text, demo script · **submit** |
| **Mon 10-12** | Buffer only |

## Inputs I need from you

- **Top up Namecheap by $2+** (Account → Top Up) so I can register `useakashi.xyz`; or buy it in the dashboard yourself and I do the DNS.
- **API setup complete (2026-10-07):** using Zen, created Groq, Serper, Jina, and IPinfo accounts with Blockchain Oracle; reused existing Firecrawl and OpenWeather keys. All six keys are in Git-ignored local `.env` (0600) and passed live API checks. See [provider setup handoff](provider-account-handoff-2026-10-07.md). Firecrawl has 146 credits remaining; Serper started with 2,500 and Jina with 10M tokens. Coolify runtime configuration and connector wiring are pending. No paid upgrade was purchased.
- **Send two consent emails** I draft (Firecrawl, Exa). Firecrawl runs on testnet meanwhile (no real money changes hands); Exa stays off until a yes.
- A **model key** for the chat (`AI_GATEWAY_API_KEY`, or `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`). The Groq key can drive it as a fallback (`@ai-sdk/groq`, gpt-oss-120b).
- **Testnet USDC** for the demo payer from faucet.circle.com (it has a CAPTCHA, so you click it).
- Optional: WalletConnect project id (else extension wallets only).
- Before submitting: OK to make `Blockchain-Oracle/akashi` public (the form needs a repo link) and to publish the CLI to npm.

## Verification

- Gates per step: `uv run ruff check . && uv run pyright`; `pnpm lint && pnpm typecheck && pnpm build`.
- API: every connector's example input runs live (`akashi-tools probe --all`), JSON-only errors, response ≤ cap, < 8 s.
- Gateway: unpaid `POST /v1/run` → 402 whose `PAYMENT-REQUIRED` decodes to the endpoint price / `eip155:84532` / payTo; paid → 200 + `PAYMENT-RESPONSE` tx on sepolia.basescan.org; a forced provider error → JSON error and **no** settlement; pocket-ap `-v` shows session + supplier.
- Pocket: settled claim for `tool-router` on Beta; `GET mcp.pocketmcp.network/api/audit?network=beta&ids=tool-router&operator=pokt1qnrj…` all PASS.
- Web (built-in browser, 375/768/1280): landing, `/tools`, endpoint modal Try it, `/agent` — connect wallet modal pops, PayCard signs, result card renders, receipt links resolve, history persists across reload.
- CLI + local MCP: `akashi run firecrawl search …` pays and prints the receipt; Claude Code with the MCP calls discover → inspect → run.
- Deploys: GHCR images → `coolify deploy`; healthy container + smoke request (deploy-verify), rows in `acceptance.md`.
