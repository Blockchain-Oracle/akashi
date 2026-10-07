# IDs, addresses, transactions (Beta) — public values only. NO keys or mnemonics.

## Environment
| item | value | fetched / verified |
|---|---|---|
| pocketd version | 0.1.35 (release tarball, sha256 aa17f136…0aee3 verified; `~/.local/bin`) · pocket-ap 0.1.2 (brew) | 2026-09-30 03:10 UTC; Beta app version 0.1.35 |
| chain_id (RPC /status) | pocket-lego-testnet | 2026-09-30 03:10 UTC, height 691083 |
| add_service_fee / supplier min_stake / app min_stake / CUTTM | 1,000 POKT / 59,500 POKT / 1,000 POKT / 40,000 (1 CU = 0.04 uPOKT) · supplier unbonding 86 sessions · 20 blocks/session | 2026-09-30 03:16 UTC (`live_params.py`) |
| Beta CUPR distribution (all 97 services) | median 10,000 · p95 50,000 · max 300,000 | 2026-09-30 03:17 UTC (`query service all-services`) |

## Base Sepolia (x402) wallets — public addresses only; keys in `~/.akashi-secrets/*-base-sepolia.json` (0600)
| role | address | notes |
|---|---|---|
| payTo (AKASHI_PAY_TO) | 0x8164dabAfc824322221654ED421715FdaA66948D | receives every paid run |
| demo payer | 0xF2A2eD6Fc57e32A6DC5A6F371ED8996AC30f9ebA | pays demo / free-mode runs; needs Circle-faucet USDC (user, CAPTCHA) |

## Accounts
| role | key name | address | funded tx | notes |
|---|---|---|---|---|
| owner | akashi-owner | pokt16p53au7ctwrtfdwd23pt2tv54nj9f0n8wsj805 | faucet FEC5A458…DDCCEB (h 691087, 100,000 POKT) | mnemonic in `~/.akashi-secrets/` (0600) → user's password manager ☐ |
| operator | akashi-operator | pokt1qnrjr3susgpyh4a4rx8f0x0wd6pqdtptr50ayg | 7A833ED7…FDE01 (h 691090, 62,000 POKT) | pubkey tx ✅ A55CA353…1C620 (h 691094) · server key file ☐ |
| app cite | akashi-app-cite | pokt14d678cn7kzjy6zux5z7ekymz3dlnj3sgjme4mj | 184F7708…096B (h 691091, 1,200 POKT) | |
| app code | akashi-app-code | pokt1wvnlcp0dkqq77qwvnn6afm38quagfhskrqdxw6 | 0E86F5E4…8EF0 (1,200 POKT) | |
| app now | akashi-app-now | pokt192ecm47znuvr4kr48rzc8zm6npjm6eq8j2cf35 | 86B2171F…2732 (1,200 POKT) | |

## Services
| id | on-chain name | CUPR | card sha256 | add-service tx | height | updates |
|---|---|---|---|---|---|---|
| citation-verify | Akashi Citation Verifier | 40000 | 530cb1445e0a0bb7… (v1) | 8CA28E2F9F8628FD8BF017D56A259702EF2D4FB62BF56B4ECCBF630DCA22BF6C | 691097 | v1 card points at the temp sslip host; re-publish on the domain (gas only) |
| code-reality-check | Akashi Code Reality Check | 20000 | 580d1a8f3d25505c… (v1) | 0829C8D96D3911A73948471568D63F8D03AEB6DCB5ECDE1B1136515229642E2E | 691098 | same |
| live-facts | Akashi Live Facts | 10000 | dbead1479954aa9a… (v1) | 33CD6B89D18036FFAC17D8AAF0F9E8FB4D087B8FE5FFFD410CD4899265D69C09 | 691099 | same |
| **tool-router** | Akashi Tool Router | 20000 (800 uPOKT/relay) | `deploy/pocket/tool-router.card.min.json` (2,596 B; on-chain card byte-identical, 2026-10-07) | A96AAAB2B2BA81723ABB3C74BF10C7B79A7D55F07992D7F2F365B51D2AFE67F7 | 711952 | v1 card spec URL on the temp sslip host; re-publish on useakashi.xyz (gas only) |

> 2026-10-07: citation-verify, code-reality-check and live-facts are **retired** (user's pivot to the tool router, S14). They stay registered on chain (IDs are permanent) but are no longer served, staked or submitted.

## Supplier
| stake tx | amount | endpoint | activation height | updates |
|---|---|---|---|---|
| E8997D51009D84EE42FFB9B69F0905C55AD4762ABD02F60645634784B97D4915 (h 712494, 2026-10-07, operator-signed) | 60,000 POKT | https://relay.84.46.247.92.sslip.io (REST, temporary host) | 712501 | re-stake on relay.useakashi.xyz when the domain exists (gas only) |

## App stakes
| service | app addr | stake tx | amount | delegations |
|---|---|---|---|---|
| tool-router | pokt14d678cn7kzjy6zux5z7ekymz3dlnj3sgjme4mj (key `akashi-app-cite`, reused) | 113EFC5118886B6F65EF23B2028F8ECCBAA6C0986BCC0E1E8E0CF5DE85835BBC (h 712014, 2026-10-07) | 1,000 POKT | none (pocket-ap signs with the app key directly) |
| tool-router (re-stake) | same | 9986F9632F7D30D8C0499DB8A71B75C858E1D8A64DB80F5921B33579A666A316 (h 712567, EventApplicationStaked + EventApplicationUnbondingCanceled) | 1,150 POKT | the 1,000 POKT stake fell to 999.999199 after the first settled claim and the protocol unstaked it (below min_stake) |

## Relays and claims
| service | session end | #relays | MsgCreateClaim tx | settled? | proof tx | chosen Test Tx ✓ |
|---|---|---|---|---|---|---|
| tool-router | 712520 (session dfd96816…7683c) | 1 (800 uPOKT claimed) | AC215AB4282193BDE42DD2EA99E419C0E489F17594371D64988A89F3F9A3E244 (h 712535, code 0, EventClaimCreated) | **settled 2026-10-07 16:14:50 UTC** (1 relay, 800 uPOKT) | 6729C253844DF7CF7FEF9BDBD169F09D517067F2C09BF945D7659A4703E06560 (h 712544, code 0, EventProofSubmitted; required: 800 > 100 uPOKT threshold) | ✓ (first settled claim) |
| tool-router | 712540 | 4+ (paid runs 16:05 UTC) | claimed (in flight 16:15) | – | – | |

### Paid runs (x402 on Base Sepolia → Pocket relay) — each one is a USDC transfer payer → payTo
| when (UTC) | endpoint | price | settlement tx (sepolia.basescan.org) | via |
|---|---|---|---|---|
| 2026-10-07 15:57 | wikipedia/summary | $0.001 | 0xb544a3a445ed90c0a4d23794c63f6524723ea986628f5abac15b286c63c0a32b (block 47810180, 0.001 USDC F2A2…9ebA → 8164…948D) | pocket (first relayed paid run) |
| 2026-10-07 16:05 | wikipedia/summary · npm/package · akashi/time · hackernews/search | $0.001–0.005 | 0x1feff0ad…69bd6 · 0x9a3ebb72…a1b737 · 0x5ce353e5…aa1f · 0x074e852c…f7ce | pocket |
| 2026-10-07 16:05 | frankfurter/latest (no such id) · datamuse/words (bad input) | – | none: 404 and a 422 pre-check, never charged | – |

## Coolify
| resource | uuid | type | domain | alias | mem | last deploy |
|---|---|---|---|---|---|---|
| project `akashi` | 43kqbdz2dncah0wuhzob5f7b | project | – | – | – | – |
| app-redis `akashi-app-redis` | wr4snhvj0y0ww3u95x6veuew | Coolify Redis (redis_conf: maxmemory 128mb, allkeys-lru, no persistence) | internal only | host `wr4snhvj0y0ww3u95x6veuew:6379` | 160m | 2026-09-29 |
| app `akashi-api` | qbjpovbitgqrjgafdcrigqmd | Dockerfile `/services/api/Dockerfile`, base `/`, gzip off | temp `http://qbjpovbitgqrjgafdcrigqmd.84.46.247.92.sslip.io` | `api.internal` (container name) | 768m | 2026-09-29 @ a28f4f6 (deployment wfikzbrrzwaynup8uqkkm4we) |
| app `akashi-ts-introspect` | jrsfoxtd9twkyj1lqpmmu8jh | Dockerfile `/services/ts-introspect/Dockerfile`, internal only (domain removed) | – | `ts-introspect.internal` | 512m | 2026-09-29 @ a6abc64 |
| akashi-nli | hxw9imsx4dn8k7llok6igo8a | container `nli.internal`:8100, 1800m / 2 CPU, no public domain; api env AKASHI_NLI_URL=http://nli.internal:8100; api env AKASHI_OPENALEX_API_KEY, AKASHI_TWELVEDATA_API_KEY, AKASHI_MASSIVE_API_KEY set (runtime only; values only in Coolify), AKASHI_STOCKS_ENABLED=true |
| api volume | jgoe0grdxfpxqcvm3dvkqxpm | `qbjpovbitgqrjgafdcrigqmd-akashi-api-data` → /data (news.db, jobs.db, toplists) |
| api scheduled tasks | – | gdelt-ingest `2,17,32,47 * * * *` · jobs-ingest `20 */6 * * *` (akashi-task) |
| private key `akashi-deploy-key` | 7izaxr1xhppq74ashloilmoc | deploy key (GitHub id 164816962, read-only) | – | – | – | – |
| app `akashi-gateway` | mwivqpuwa5rpwtrxpwjc1j0w | Docker Image `ghcr.io/blockchain-oracle/akashi-gateway:main` | temp `https://mwivqpuwa5rpwtrxpwjc1j0w.84.46.247.92.sslip.io` (→ api.useakashi.xyz) | – | 192m | env AKASHI_API_URL=http://api.internal:8000, POCKET_AP_URL=http://pocket-ap.internal:8550, AKASHI_PAY_TO, DEMO_WALLET_PRIVATE_KEY (secret) |
| app `akashi-relayminer` | 8sf3farw1wl5gjnrm50fd95s | Docker Compose `/deploy/pocket/compose.yaml` (redis 8.10.1 noeviction, miner + relayer v0.1.0), connected to the coolify network | relayer `https://relay.84.46.247.92.sslip.io` | – | 256m each | configs at /opt/pocket/config (sync-config.sh), key at /opt/pocket/secrets |
| app `akashi-pocket-ap` | 0nfqgxdf8cdwb43mecpycxhd | Dockerfile `/deploy/gateway/pocket-ap.Dockerfile` (internal, no domain) | – | `pocket-ap.internal` | 128m | env POCKET_APP_PRIVATE_KEY (secret: tool-router app key) |
| app `akashi-web` | uaydz8sozk7g4fgbqr49rj2a | Docker Image `ghcr.io/blockchain-oracle/akashi-web:main` (private; server's ghcr login) | temp `http://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io` | – | 320m | env AKASHI_API_URL=http://api.internal:8000 |
| app `akashi-docs` | k7ds7ucqsnaxw5lorj8a9buu | Docker Image `ghcr.io/blockchain-oracle/akashi-docs:main` (private) | temp `http://k7ds7ucqsnaxw5lorj8a9buu.84.46.247.92.sslip.io` | – | 192m | GitHub vars NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_DOCS_URL = the two temp URLs (baked at build) |
| stopped 2026-10-07 | hxw9imsx4dn8k7llok6igo8a (akashi-nli), jrsfoxtd9twkyj1lqpmmu8jh (akashi-ts-introspect) | retired services; also stopped at the user's request: kawase-voice, logos-kit-preview-net (server overload) | | | | |

## DNS / TLS
| host | A record | cert checked |
|---|---|---|

## Audit runs
| date | file | A1..A9 per id | notes |
|---|---|---|---|
| 2026-10-07 16:15 UTC | audits/2026-10-07-tool-router.json | tool-router: PASS ×9 | operator pokt1qnrj…, endpoint https://relay.84.46.247.92.sslip.io (temporary), card sha256 596f2bd8… |

## Organizer comms
| date | channel | asked | answer |
|---|---|---|---|

## Submission
| service | submitted (date) | fields snapshot |
|---|---|---|
