# Submission draft: Akashi Tool Router (`tool-router`)

Form: https://docs.google.com/forms/d/e/1FAIpQLScOgCt7oZhIGWgvMNBNxxmK-6W_7wTJbpzAvI-_KxqEk52BIw/viewform
Fields in form order. **The user fills Name, Email and Discord** and ticks the confirmation box. Hosts are the temporary
sslip.io ones until `useakashi.xyz` is registered; if the domain lands before submitting, swap every URL below and
re-stake the supplier on `relay.useakashi.xyz` first.

| Field | Value |
|---|---|
| Name | (user) |
| Email | (user) |
| Discord Username | (user) |
| Service Name | Akashi Tool Router |
| Testnet Service ID | `tool-router` |
| Endpoint URL | `https://relay.84.46.247.92.sslip.io` |
| Test Transaction ID | `AC215AB4282193BDE42DD2EA99E419C0E489F17594371D64988A89F3F9A3E244` (MsgCreateClaim for a real relay, h712535; proof `6729C253…6560` h712544; settled 2026-10-07 16:14:50 UTC) |
| Repository Link | `https://github.com/Blockchain-Oracle/akashi` (private today: making it public needs the user's OK) |
| Category | AI tool |

## Service Description

Akashi is OpenRouter for agent tools: one Pocket service in front of 70 tool endpoints from 29 providers. Live web
search, page reading, cited answers, research papers, packages, GitHub, weather, FX, time zones, holidays, news, jobs,
dictionaries, science data and more. An agent asks `discover` for the best tool for a job (ranked with price and live
health), reads its JSON Schema with `inspect`, then runs it, all with the same envelope, provenance and error shape
whatever the provider. Off the portal, every paid run is an x402 USDC micropayment ($0.001–$0.01) that travels as a
real Pocket relay through Akashi's own supplier, and a failed run is never charged. No accounts, no API keys: the
payment is the credential.

## How should judges test your service?

```
1) Chat (no wallet needed): open https://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io/agent and ask e.g.
   "Is it raining in Lagos right now, and what is 100 USD in NGN?" Demo credit pays. Each answer shows the tool cards,
   the x402 receipt (Base Sepolia settlement tx) and "Pocket relay · tool-router".

2) Free calls (any HTTP client):
   curl -X POST https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io/v1/discover \
     -H 'content-type: application/json' -d '{"query":"weather in a city","limit":3}'
   curl -X POST https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io/v1/inspect \
     -H 'content-type: application/json' -d '{"id":"wikipedia/summary"}'

3) Paid run: POST /v1/run/wikipedia/summary with {"title":"Alan Turing"} answers 402 with the x402 price. Pay with any
   x402 client, or the CLI (Base Sepolia key with test USDC):
   curl -O https://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io/akashi.mjs
   AKASHI_PRIVATE_KEY=0x… AKASHI_API_URL=https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io \
     node akashi.mjs run wikipedia/summary --input '{"title":"Alan Turing"}'

4) MCP: add https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io/mcp (Streamable HTTP) to Claude/Cursor:
   akashi_discover, akashi_inspect, akashi_run (runs paid by Akashi's demo wallet, capped per day).

5) Through Pocket directly (staging portal, or pocket-ap with an app staked for tool-router): the same paths relay
   as-is, e.g. POST /v1/discover {"query":"search the web"} or POST /v1/run/akashi/time {"zone":"Asia/Tokyo"}.
   Identity probe: GET /v1/version → {"service":"tool-router"}.
```

## Evidence (all on Beta unless noted; full ledger in `docs/plan/ids-and-txs.md`)

- add-service `A96AAAB2B2BA81723ABB3C74BF10C7B79A7D55F07992D7F2F365B51D2AFE67F7` (h711952)
- supplier stake `E8997D51009D84EE42FFB9B69F0905C55AD4762ABD02F60645634784B97D4915` (h712494)
- app stake `113EFC5118886B6F65EF23B2028F8ECCBAA6C0986BCC0E1E8E0CF5DE85835BBC` (h712014), re-stake
  `9986F9632F7D30D8C0499DB8A71B75C858E1D8A64DB80F5921B33579A666A316` (h712567)
- first relayed paid run, Base Sepolia `0xb544a3a445ed90c0a4d23794c63f6524723ea986628f5abac15b286c63c0a32b`
- claim `AC215AB4…E244` → proof `6729C253…6560` → settled (1 relay, 800 uPOKT)
- Service Audit A1–A9: PASS 9/9, 2026-10-07 16:15 UTC (`docs/plan/audits/2026-10-07-tool-router.json`)
