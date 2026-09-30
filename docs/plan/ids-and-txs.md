# IDs, addresses, transactions (Beta) — public values only. NO keys or mnemonics.

## Environment
| item | value | fetched / verified |
|---|---|---|
| pocketd version | 0.1.35 (release tarball, sha256 aa17f136…0aee3 verified; `~/.local/bin`) · pocket-ap 0.1.2 (brew) | 2026-09-30 03:10 UTC; Beta app version 0.1.35 |
| chain_id (RPC /status) | pocket-lego-testnet | 2026-09-30 03:10 UTC, height 691083 |
| add_service_fee / supplier min_stake / app min_stake / CUTTM | 1,000 POKT / 59,500 POKT / 1,000 POKT / 40,000 (1 CU = 0.04 uPOKT) · supplier unbonding 86 sessions · 20 blocks/session | 2026-09-30 03:16 UTC (`live_params.py`) |
| Beta CUPR distribution (all 97 services) | median 10,000 · p95 50,000 · max 300,000 | 2026-09-30 03:17 UTC (`query service all-services`) |

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

## Supplier
| stake tx | amount | endpoint | activation height | updates |
|---|---|---|---|---|

## App stakes
| service | app addr | stake tx | amount | delegations |
|---|---|---|---|---|

## Relays and claims
| service | session end | #relays | MsgCreateClaim tx | settled? | proof tx | chosen Test Tx ✓ |
|---|---|---|---|---|---|---|

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

## DNS / TLS
| host | A record | cert checked |
|---|---|---|

## Audit runs
| date | file | A1..A9 per id | notes |
|---|---|---|---|

## Organizer comms
| date | channel | asked | answer |
|---|---|---|---|

## Submission
| service | submitted (date) | fields snapshot |
|---|---|---|
| app `akashi-web` | uaydz8sozk7g4fgbqr49rj2a | Docker Image `ghcr.io/blockchain-oracle/akashi-web:main` (private; server's ghcr login) | temp `http://uaydz8sozk7g4fgbqr49rj2a.84.46.247.92.sslip.io` | – | 320m | env AKASHI_API_URL=http://api.internal:8000 |
| app `akashi-docs` | k7ds7ucqsnaxw5lorj8a9buu | Docker Image `ghcr.io/blockchain-oracle/akashi-docs:main` (private) | temp `http://k7ds7ucqsnaxw5lorj8a9buu.84.46.247.92.sslip.io` | – | 192m | GitHub vars NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_DOCS_URL = the two temp URLs (baked at build) |
