# Acceptance / evidence ledger

Every tx, claim, audit run and deploy, in order. **Failed attempts stay in.**

| UTC | Stage | Scenario | Network | Hash / ref | Result | Artifact |
|---|---|---|---|---|---|---|
| 2026-09-29 12:34 | S0 | Private GitHub repo created + pushed | – | github.com/Blockchain-Oracle/akashi | ok | – |
| 2026-09-29 12:34 | S0 | Coolify project + read-only deploy key | Coolify | project 43kqbdz2…, key 7izaxr1x… | ok (first project create 422 on non-ASCII description) | – |
| 2026-09-29 13:10 | S1 | app-redis created, redis_conf applied, restarted | Coolify | wr4snhvj… | ok (CONFIG GET → allkeys-lru, 134217728) | – |
| 2026-09-29 13:14 | S1 | akashi-api deployed (a28f4f6) | Coolify | deployment wfikzbrr… | ok: probes 200, 404 JSON, no gzip, 39 MiB RSS, redis ping True | – |
| 2026-09-29 15:05 | S3 | ts-introspect + api deploys failed: clone 'Permission denied (publickey)' after a successful ls-remote | Coolify | – | failed ×3 (transient: the key cloned fine from the Mac and the server; a sequential retry succeeded) | – |
| 2026-09-29 15:20 | S3 | akashi-ts-introspect + akashi-api deployed (a6abc64) | Coolify | – | ok: npm/pypi/go/cargo symbols + package verdicts live; api 76 MiB, sidecar 156 MiB, 3.6 GiB avail | – |
| 2026-09-29 15:05 | S3 | api deployed @6e4ab3f reported 'finished' but **crash-looped**: ModuleNotFoundError akashi_code.data (the `.gitignore` `data/` rule hid package data) | Coolify | – | FAILED in prod ~5 min; fixed by da0cff2 (anchor `/data/`) | – |
| 2026-09-29 15:12 | S3 | api redeployed @da0cff2, verified healthy + live /v1/check | Coolify | – | ok: 299 ms, reqeusts→nonexistent_package, s.mountx→nonexistent_symbol | – |
| 2026-09-29 16:40 | S4 | akashi-api deployed (g++ builder fix) | Coolify | – | ok: container healthy; live gate: Varghese not_found/page_inside_other_case, Wakefield retracted 2010-02-06, nature14539 verified, wrong year mismatch, arXiv verified, SSRF 169.254.169.254 → 422, probe Brown verified (7 ms); 10-cite batch 2.6 s cold / 223 ms warm | – |
| 2026-09-29 16:45 | S4 | citation calibration against production | api | – | ok: real 40/40 verified · fabricated 40/40 not_found | – |
| 2026-09-29 17:30 | S4 | akashi-nli created + deployed; api redeployed with /claim | Coolify | – | ok: nli healthy (load 3.4 s, 1.21 GiB loaded, 8 pairs 0.35 s); claim gate 6/6 correct; bodies validate against output-schema | – |
| 2026-09-30 02:30 | S5 | live-facts: time/holidays/business-days/fx/weather/fact/news/jobs deployed; volume + 2 scheduled tasks | Coolify | – | ok: 8/8 bodies schema-valid; probe +00:00; 20-concurrent memory gate within limits; claims 3.9–5.4 s cold after D-020 | – |
| 2026-09-30 02:34 | S6 | api deployed @792fa2c: `/specs/<id>.openapi.json` | Coolify | gijqd3kb… | ok: healthy; live sha256 = repo for all 3 specs | – |
| 2026-09-30 02:45 | S6 | lint_backend ×3 (card healthchecks + bad-input probes) | api | – | ok: 8/8 · 6/6 · 7/7 | – |
| 2026-09-30 02:47 | S6 | schemathesis ×3 (first pass) | api | – | FAIL: 500 on /symbols `[""]`; 405 without Allow; undocumented 400/413; either/or rules not in schema | fixed 90147fc |
| 2026-09-30 02:47 | S6 | **prod bug**: `/check` `import reqeusts` → `ok` on every cached lookup (enum lost in JSON cache) | api | – | FAIL (live since S3; S3 gate only saw cold calls) | fixed aae8329 |
| 2026-09-30 02:55 | S6 | schemathesis ×3 (second pass, 226–459 cases) | api | – | FAIL: 500s on blank citation / blank place | fixed 98a0d6c |
| 2026-09-30 03:05 | S6 | schemathesis gate pass 3 (783 / 614 / 972 cases) | api | – | cite 1×500 (pmid control char, blank authors) · code 1×500 (control char in package name) · **now PASS 972/972** | fixed a731410, 3a460fa |
| 2026-09-30 03:05 | S6 | latency (pre-fix build) | api | scripts/latency.py | ok: cold p95 cite 2.04 s / code 1.54 s / now 1.75 s; warm 0.48 / 0.80 / 1.04 s (targets 6 / 6.5 / 3 s) | – |
| 2026-09-30 03:10 | S2 | pocketd 0.1.35 + pocket-ap 0.1.2 installed; 5 test-keyring keys | local | – | ok (mnemonics in ~/.akashi-secrets, 0600) | – |
| 2026-09-30 03:11 | S2 | faucet 100,000 POKT → owner | beta | FEC5A45873198A060221980E3E2D64DE026ED7EAB2DA70464998374A69DDCCEB | ok h 691087 | – |
| 2026-09-30 03:12 | S2 | bank sends: operator 62,000; apps 1,200 ×3 | beta | 7A833ED7… · 184F7708… · 0E86F5E4… · 86B2171F… | ok (first attempt of app-code/app-now: account sequence mismatch, resent after commit) | – |
| 2026-09-30 03:14 | S2 | operator pubkey (1 upokt self-send) | beta | A55CA353B75A0214D2E1026B80887CB90BE7DAE443503085FFA7B9BA5201C620 | ok h 691094, secp256k1 pubkey on account | – |
| 2026-09-30 03:18 | S2 | add-service ×3 (40k / 20k / 10k CUPR, v1 cards) | beta | 8CA28E2F… h691097 · 0829C8D9… h691098 · 33CD6B89… h691099 | ok: name/CUPR/owner read back; `encode_card.py diff` identical ×3; pocketd validate-card ✅ ×3 | – |
| 2026-09-30 03:25 | S6 | **schemathesis gate on the final build** (3a460fa) | api | – | **PASS: cite 892/892 · code 677/677** (now 972/972 on the prior build; now code unchanged since) | – |
| 2026-09-30 03:35 | S4/S6 | citation calibration, production API, after the cite changes | api | – | **PASS: real 40/40 verified · fake 40/40 not_found** (batches 0.4–1.6 s real, 3.5–5.1 s fake) | – |
| 2026-09-30 03:37 | S6 | latency (final build, Mac at load ≈100) | api | scripts/latency.py | cite cold p95 1.25 s / warm 0.62 · code 1.42 / 0.60 · **now cold p95 3.95 s, one request 5.99 s wall (OVER)**, warm 1.52 s. Fresh cold re-measure of all 9 now endpoints: wall ≤ 1.70 s, server elapsed_ms ≤ 1,377. Outlier not attributed (upstream ReadTimeout retries in the log; client load); re-measure from the server after the domain | open |
| 2026-09-30 04:50 | S5 | /now/v1/stocks local gate (both keys, flag on) | local | – | ok: AAPL/BRK.B/SPY/NVDA/TSLA/AMZN/GOOGL/META closes agree with Massive to the cent; 5 typos → not_found + did-you-mean with no Twelve Data credit spent; credits exhausted → Massive close, partial, 0.15 s; no Massive key → APPLX stale; flag off → 422 unsupported; **schemathesis /v1/stocks 86/86** | – |
| 2026-09-30 04:58 | S5 | akashi-api deployed @948d412 (stocks, deployment r3mq2mhuuiyjqldgufj2jich) | Coolify | – | ok: running:healthy; live AAPL/SPY/brk-b agree + APPL/NVIDA suggestions, 554 ms server (cold) / 29 ms (cached); body validates against output-schema; /v1/time probe 200 | – |
| 2026-09-30 10:25 | S7/S10 | web + docs deployed @fb4ac84 on HTTPS (Let's Encrypt on the sslip hosts); api moved to HTTPS | Coolify | – | ok: docs /, /docs, pocket pages, services, reference, llms.txt 200; live status pill 'All three services live'; web /api/health 200 | – |
| 2026-10-07 11:50 | S14 | add-service tool-router (CUPR 20000, card 2,596 B) | beta | A96AAAB2B2BA81723ABB3C74BF10C7B79A7D55F07992D7F2F365B51D2AFE67F7 h711952 | ok: on-chain card byte-identical | – |
| 2026-10-07 12:20 | S14 | app stake tool-router (1,000 POKT, key akashi-app-cite) | beta | 113EFC5118886B6F65EF23B2028F8ECCBAA6C0986BCC0E1E8E0CF5DE85835BBC h712014 | ok | – |
| 2026-10-07 15:00 | S14 | first paid run attempt via the gateway | api | – | **failed 502**: pocket-ap "session fetch failed" (no supplier yet) and the direct fallback waited on a slow Redis in health.record → health persisted in the background (c999212) | – |
| 2026-10-07 15:40 | S14 | RelayMiner deploys | Coolify | 8sf3farw… | failed ×2 (miner health gate; configs mounted as directories) → start_period 180 s + configs at /opt/pocket/config (d1bc3e5, 1a650de) → ok | – |
| 2026-10-07 15:49 | S14 | supplier stake 60,000 POKT, endpoint https://relay.84.46.247.92.sslip.io | beta | E8997D51009D84EE42FFB9B69F0905C55AD4762ABD02F60645634784B97D4915 h712494 | ok: active from 712501 | – |
| 2026-10-07 15:57 | S14 | **first x402-paid run relayed over Pocket** (wikipedia/summary, $0.001) | base-sepolia | 0xb544a3a445ed90c0a4d23794c63f6524723ea986628f5abac15b286c63c0a32b | ok: 200, via pocket, 0.001 USDC payer → payTo (block 47810180) | ids-and-txs.md |
| 2026-10-07 16:01 | S14 | miner NOAUTH: "redis" also resolved to coolify-redis on the shared network | Coolify | – | fixed: service renamed pocket-relay-redis (8eb0697); NOAUTH count 0 after redeploy | – |
| 2026-10-07 16:05 | S14 | 4 paid relays + 2 refused runs | base-sepolia | 0x1feff0ad… 0x9a3ebb72… 0x5ce353e5… 0x074e852c… | ok: 4 × via pocket; unknown id → 404 and bad input → 422 pre-check, no charge | ids-and-txs.md |
| 2026-10-07 16:05 | S14 | MsgCreateClaim, session 712520 | beta | AC215AB4282193BDE42DD2EA99E419C0E489F17594371D64988A89F3F9A3E244 h712535 | ok: code 0, EventClaimCreated, 800 uPOKT | – |
| 2026-10-07 16:10 | S14 | MsgSubmitProof, session 712520 (required: 800 > 100 uPOKT) | beta | 6729C253844DF7CF7FEF9BDBD169F09D517067F2C09BF945D7659A4703E06560 h712544 | ok: code 0, EventProofSubmitted | – |
| 2026-10-07 16:09 | S14 | parallel chat tool calls: 1 of 2 settlements failed | base-sepolia | – | **failed**: x402.org facilitator nonce race ("replacement transaction underpriced"); fixed by serial settlement + retry (3eb3345), local 3/3 parallel settled | – |
| 2026-10-07 16:14 | S14 | **claim settled**: tool-router, 1 relay, 800 uPOKT | beta | session 712520 | **ok** (indexer 16:14:50) | – |
| 2026-10-07 16:15 | S14 | **Service Audit A1–A9** tool-router, operator pokt1qnrj… | beta | card sha256 596f2bd8… | **PASS 9/9, no findings**; 800 uPOKT/relay, 48th percentile of 116 | audits/2026-10-07-tool-router.json |
