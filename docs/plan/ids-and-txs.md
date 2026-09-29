# IDs, addresses, transactions (Beta) — public values only. NO keys or mnemonics.

## Environment
| item | value | fetched / verified |
|---|---|---|
| pocketd version | | |
| chain_id (RPC /status) | pocket-lego-testnet (expected) | |
| add_service_fee / supplier min_stake / app min_stake / CUTTM | | |

## Accounts
| role | key name | address | funded tx | notes |
|---|---|---|---|---|
| owner | akashi-owner | | | mnemonic in the user's password manager ☐ |
| operator | akashi-operator | | | pubkey tx ☐ · server key file ☐ |
| app cite | akashi-app-cite | | | |
| app code | akashi-app-code | | | |
| app now | akashi-app-now | | | |

## Services
| id | on-chain name | CUPR | card sha256 | add-service tx | height | updates |
|---|---|---|---|---|---|---|
| citation-verify | Akashi Citation Verifier | 40000 | | | | |
| code-reality-check | Akashi Code Reality Check | 20000 | | | | |
| live-facts | Akashi Live Facts | 10000 | | | | |

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
| akashi-nli | hxw9imsx4dn8k7llok6igo8a | container `nli.internal`:8100, 1800m / 2 CPU, no public domain; api env AKASHI_NLI_URL=http://nli.internal:8100; api env AKASHI_OPENALEX_API_KEY set (value only in Coolify) |
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
