# Spec — Pocket Beta + Coolify deployment runbook (design; nothing below has been executed)

> **Source:** Plan agent "Pocket + Coolify deployment runbook", 2026-09-29, transcribed right after plan approval.
> **Reconciled with `../00-plan.md` (the plan wins):**
> - **IDs** are **`citation-verify`** (was `akashi-cite`), **`code-reality-check`** (was `akashi-code`), **`live-facts`** (was `akashi-now`). The user chose capability IDs, which settles §0.1. Key names such as `akashi-app-cite` are local keyring labels and stay as they are.
> - **On-chain names** are `Akashi Citation Verifier`, `Akashi Code Reality Check`, `Akashi Live Facts`.
> - **Relay host** is `relay-beta.<d>`. The domain is being bought by the user.
> - **Functional probes** follow `specs/backend.md`: Obergefell / axios fetchJson / Casablanca time. The probes drafted in §3.3 below (nature DOI / requests / JP holidays) are superseded.
>
> **Markers:** **[OK?]** = spends POKT or changes the server; needs the user's explicit OK at that moment. **[KB-FIX]** = the KB correction wins over the skill template or docs.

## 0. Settle before any spend
1. ~~Brand vs capability IDs~~ → **settled: capability IDs.**
2. **The on-chain name must be ASCII,** matching `^[a-zA-Z0-9-_ ]+$` (`x/shared/types/service.go:34`). No 証, `.`, `:`, `(`, `/`, `&`, `'`. Avoid hyphens in names.
3. **Path contract.** Gateways, pocket-ap and portal callers use **unprefixed** `/v1/...` paths. The relayer's backend URL `http://api.internal:8000/cite` joins the prefix in front (`path.Join`; `mergeBackendPath` / `joinURLPath` in `relayer/healthcheck.go:538`), and health checks are joined the same way (`/cite/v1/health`). What this requires:
   - card probes, OpenAPI, portal `methods` and examples all use `/v1/...`;
   - FastAPI answers `GET/HEAD /cite` with 2xx JSON;
   - a per-service prefix-stripped OpenAPI.

   **[KB-FIX]** This deliberately departs from the KB's "mount at /" advice. It is supported; verify with `pocket-ap --compare`.
4. **The relayer needs the IDs on-chain first** (the miner publishes a per-service pricing manifest, otherwise 503 `pricing_unavailable`). Order: register → deploy the pocket stack → stake the supplier.

## 1. Local setup on macOS
```bash
curl -sSL https://raw.githubusercontent.com/pokt-network/poktroll/main/tools/scripts/pocketd-install.sh | bash -s -- --tag v0.1.35 --upgrade
pocketd version
brew install jq; pip3 install jsonschema
brew tap pokt-network/tap && brew trust --formula pokt-network/tap/pocket-ap && brew install pocket-ap   # brew trust required on Homebrew 6+
pocket-ap version                                 # expect v0.1.2
export PSB=/Users/abu/dev/hackathon/portnetwork/.research/repos/pocket-network-resources/service-builder/unpacked/pocket-service-builder
```
- Fallbacks: `brew tap pokt-network/poktroll && brew install pocketd`, or the `pocket_darwin_arm64.tar.gz` release.
- Pocket MCP `skill_version` with installed `12aa7eeedd3e`. If it's newer, use the MCP `pocket://references/...` resources.
- ⚠️ The fact-check noted the install script does not support `--tag latest`. Pin an explicit tag, or use the plain `| bash` form (`pocketd/index.mdx`).

**Keyring:** `--keyring-backend test` (Beta only; never reuse these keys on MainNet).
```bash
export KR="--keyring-backend test"
export TXF="--network=beta --keyring-backend test --gas auto --gas-prices 1upokt --gas-adjustment 1.5"   # no --yes on spends
```
- Never combine `--fees` with `--gas-prices`: a fixed `--fees` fails card txs with `out of gas in location: txSize`.

**Keys (no spend):**
```bash
pocketd keys add akashi-owner $KR; pocketd keys add akashi-operator $KR
pocketd keys add akashi-app-cite $KR; pocketd keys add akashi-app-code $KR; pocketd keys add akashi-app-now $KR
export OWNER=$(pocketd keys show akashi-owner -a $KR); export OP=$(pocketd keys show akashi-operator -a $KR)
export APP_CITE=$(pocketd keys show akashi-app-cite -a $KR); export APP_CODE=$(pocketd keys show akashi-app-code -a $KR); export APP_NOW=$(pocketd keys show akashi-app-now -a $KR)
```
- Mnemonics go to the **user's password manager only**; never the repo, `docs/plan` or chat. HD path `m/44'/635'/0'/0/0`. Recover with `--recover`.
- Record the addresses in `ids-and-txs.md`.

**Pre-flight (read-only):**
```bash
python3 $PSB/scripts/check_catalog.py citation-verify --both --name "Akashi Citation Verifier" --apis citation-verify-api
python3 $PSB/scripts/check_catalog.py code-reality-check --both --name "Akashi Code Reality Check" --apis code-reality-check-api
python3 $PSB/scripts/check_catalog.py live-facts --both --name "Akashi Live Facts" --apis live-facts-api
python3 $PSB/scripts/live_params.py --network beta --pricing
pocketd query service params --network=beta; pocketd query supplier params --network=beta
pocketd query application params --network=beta; pocketd query shared params --network=beta
curl -s https://sauron-rpc.beta.infra.pocket.network/status | jq -r .result.node_info.network   # expect pocket-lego-testnet
```
- Also run the Pocket MCP tools `check_service_id` (network=both), `live_params` (beta) and `catalog_search`.
- Record `add_service_fee`, the supplier and app `min_stake`, CUTTM and the chain ID, with the fetch date.

## 2. Funding
| Account | Purpose | Amount |
|---|---|---|
| owner | 3 × add_service_fee | 3,000 POKT |
| owner → operator | stake 60,500 (min 59,500 + margin) + claim/proof fees | send **62,000** |
| owner → 3 apps | 1,100 stake + gas each | **1,200 each** (3,600) |
| **Total** | | **≈ 68,600 POKT** |

- **Faucet:** 100,000 POKT per claim, 2 per address per 24 h. One claim to the owner covers everything; optionally a second one to the operator. Use the **web** faucet https://faucet.beta.pocket.network/. **[KB-FIX]** `pocketd faucet fund` is broken.

```bash
pocketd tx bank send akashi-owner $OP 62000000000upokt --from akashi-owner $TXF          # [OK?]
pocketd tx bank send akashi-owner $APP_CITE 1200000000upokt --from akashi-owner $TXF    # [OK?]
pocketd tx bank send akashi-owner $APP_CODE 1200000000upokt --from akashi-owner $TXF    # [OK?]
pocketd tx bank send akashi-owner $APP_NOW  1200000000upokt --from akashi-owner $TXF    # [OK?]
pocketd tx bank send akashi-operator $OP 1upokt --from akashi-operator $TXF             # [OK?] publishes operator pubkey
pocketd query auth account $OP --network=beta -o json | grep -i public_key              # non-null
```

## 3. Service registration (3 × **[OK?]**, 1,000 POKT each, non-refundable)
- **Syntax (positional):** `pocketd tx service add-service <id> "<Name>" <cupr> --card-file <file> --from akashi-owner $TXF`.
  - **[KB-FIX]** The flag form in the docs is wrong.
  - Re-running the command is how you update. **Always pass the name and CUPR** (an omitted CUPR resets to 1). Omitting `--card-file` keeps the stored card.

**CUPR** (Beta: 1 CU = 0.04 uPOKT; median 10,000, p95 50,000; A9 warns at ≥ p95, **so never 50,000**)
| ID | CUPR | Beta uPOKT/relay | MainNet ≈ $/relay |
|---|---|---|---|
| citation-verify | 40,000 | 1,600 | $0.00004 |
| code-reality-check | 20,000 | 800 | $0.00002 |
| live-facts | 10,000 | 400 | $0.00001 |

### 3.3 Card template (per `assets/service_card.schema.json`; each < 4 KiB)
- **`results`:** `"variable"` (`as_of` / `deadline_ms` change the bytes).
- **Spec URL:** `specs[].url` must resolve (A8). Before the repo is public use `https://api.<d>/specs/<id>.openapi.json`; afterwards, a raw commit URL + `sha256`.

```json
{
  "schema": "pocket-service-card/v1",
  "description": "Akashi Citation Verifier: checks that scholarly, legal and web citations are real and accurate. POST /v1/verify with {\"citations\":[...]} (max 10) returns one JSON object with a typed verdict per citation (verified, mismatch, not_found, retracted, ambiguous, unverifiable), the matched record, field-level mismatches, retraction flags, sources and as_of. POST /v1/claim says whether a source supports a claim. Every response is a JSON object, errors included ({\"error\":{\"code\",\"message\",\"retryable\"}} with 4xx). Upstream outages give partial results listed in unavailable, never a 5xx.",
  "rpc_types": [
    { "type": "REST", "intent": "expected",
      "backend_hint": "akashi-api (FastAPI) on :8000, router at /cite; relayer rest url http://<api-host>:8000/cite",
      "notes": "Only POST /v1/verify, POST /v1/claim, GET /v1/version, GET /v1/health. Inputs only in the JSON body. Every response is a JSON object." }
  ],
  "apis": ["citation-verify-api"],
  "specs": [ { "kind": "openapi", "api": "citation-verify-api", "url": "https://api.<d>/specs/citation-verify.openapi.json" } ],
  "access": "public",
  "results": "variable",
  "serving": {
    "backend": "The akashi-api container (one image serves all three services under /cite, /code, /now) behind an HA RelayMiner whose rest backend points at /cite. No auth toward the backend; callers cannot send headers. Needs outbound HTTPS to doi.org, Crossref, DataCite, OpenAlex, PubMed and the Wayback Machine.",
    "implementations": ["akashi-api >= 1.0.0"],
    "docs": "https://github.com/<owner>/akashi#operators",
    "min_disk_gb": 2, "min_ram_gb": 1,
    "healthcheck": [
      { "rpc_type": "REST", "request": { "path": "/v1/version", "method": "GET" },
        "expect": { "json_path": "$.service", "matches": "^citation-verify$" }, "notes": "Identity probe." },
      { "rpc_type": "REST", "request": { "path": "/v1/health", "method": "GET" },
        "expect": { "json_path": "$.status", "matches": "^ok$" }, "notes": "Readiness probe." },
      { "rpc_type": "REST", "request": { "path": "/v1/verify", "method": "POST", "body": { "citations": ["Obergefell v. Hodges, 576 U.S. 644 (2015)"] } },
        "expect": { "json_path": "$.results[0].verdict", "matches": "^verified$" }, "notes": "Functional probe: local legal index, deterministic." }
    ],
    "notes": "p95 under 6 s, hard stop 8.5 s; request bodies up to 64 KiB. Gateway operators: configure as type passthrough with rpc_types [\"rest\"]; see deploy/gateway/sage-service.yaml."
  },
  "docs": "https://github.com/<owner>/akashi/tree/main/docs",
  "updated": "2026-10-0X"
}
```
- **code-reality-check:** same shape.
  - Description covers `/v1/check`, `/v1/package`, `/v1/symbol`, `/v1/versions`, 8 ecosystems, typo-squats and placeholders.
  - Identity regex `^code-reality-check$`.
  - Functional probe: `POST /v1/symbol {"ecosystem":"npm","package":"axios","version":"1.7.9","symbol":"AxiosInstance.fetchJson"}` → `$.results[0].exists ^no$`.
  - Hard stop 7 s.
- **live-facts:** same shape.
  - Description covers time, holidays, fx, weather, news, stocks (demo-grade), jobs and fact, each with provenance.
  - Identity regex `^live-facts$`.
  - Functional probe: `POST /v1/time {"zone":"Africa/Casablanca","at":"2026-11-15T18:00:00Z"}` → `$.results[0].utc_offset ^\+00:00$`.
  - p95 under 3 s, hard stop 4 s.

### 3.4 Validate and publish
```bash
for s in citation-verify code-reality-check live-facts; do
  wc -c cards/$s/card.json; python3 $PSB/scripts/validate_card.py cards/$s/card.json; pocketd tx service validate-card cards/$s/card.json
done
pocketd tx service add-service citation-verify "Akashi Citation Verifier" 40000 --card-file cards/citation-verify/card.json --from akashi-owner $TXF       # [OK?]
pocketd tx service add-service code-reality-check "Akashi Code Reality Check" 20000 --card-file cards/code-reality-check/card.json --from akashi-owner $TXF # [OK?]
pocketd tx service add-service live-facts "Akashi Live Facts" 10000 --card-file cards/live-facts/card.json --from akashi-owner $TXF                     # [OK?]
pocketd query tx --type=hash <TXHASH> --network=beta
pocketd query service show-service <id> --network=beta -o json | jq '.service | {id,name,compute_units_per_relay,owner_address}'
python3 $PSB/scripts/encode_card.py diff cards/<id>/card.json --id <id> --network beta
```
- On macOS use `base64 -i f | tr -d '\n'`; `-w0` does not exist.
- Record the txhash, height, name, CUPR and card sha256. Commit, then tag `card-<id>-v1`.

## 4. Supplier stake (`deploy/pocket/supplier_stake_config.yaml`; no secrets)
```yaml
owner_address: pokt1<OWNER>
operator_address: pokt1<OP>                 # immutable after the first stake
stake_amount: 60500000000upokt              # min_stake 59,500 + 1,000 margin; re-fetch
default_rev_share_percent:
  pokt1<OWNER>: 100
services:
  - service_id: citation-verify
    endpoints: [ { publicly_exposed_url: https://relay-beta.<d>, rpc_type: REST } ]
  - service_id: code-reality-check
    endpoints: [ { publicly_exposed_url: https://relay-beta.<d>, rpc_type: REST } ]
  - service_id: live-facts
    endpoints: [ { publicly_exposed_url: https://relay-beta.<d>, rpc_type: REST } ]
```
- **Signer:** the **operator** (an owner-signed initial stake cannot include services). The stake returns to the owner on unstake.
- **When:** only after §5.7 passes (relayer healthy; `https://relay-beta.<d>/` answers **400** with a trusted cert; `/ready/<id>` healthy).

```bash
pocketd tx supplier stake-supplier --config deploy/pocket/supplier_stake_config.yaml --from akashi-operator $TXF   # [OK?] 60,500 POKT
pocketd query supplier show-supplier $OP --network=beta -o json
python3 $PSB/scripts/query_state.py --network beta --supplier $OP     # "SCHEDULED, active from height N" is normal
```
- Activation happens at the next session (≤ ~10 min). Then on the server: `relayer validate --check-stake`.

## 5. Coolify
### 5.0 Access
`ssh -f -N -L 8001:localhost:8000 agari-box`, then `coolify context list && coolify context verify`, `coolify app list`, and `ssh agari-box 'uname -m; free -h; df -h'`.

### 5.1 Repo and deploy key
- One monorepo, `github.com/<owner>/akashi`. **Private until submission, public before submitting.**
- **[OK?]** Create a Coolify private key `akashi-deploy` and add it as a **read-only** GitHub deploy key.
- Auto Deploy **off** (no GitHub App, so no watch paths). Deploy manually with `coolify deploy uuid <uuid>`.
- **Never commit** keys, mnemonics, `.env*` or the pocket-ap key.

### 5.2 DNS (before the first deploy; HTTP-01 needs it)
- A records for `relay-beta.<d>`, `api.<d>`, `<d>`/`akashi.<d>` and `docs.<d>` → the Contabo IP, TTL 300.
- On Cloudflare, **DNS-only (grey cloud)**.
- Check with `dig +short`.

### 5.3 Server secret **[OK?]**
```bash
ssh agari-box 'sudo install -d -m 0700 /opt/pocket/secrets'
pocketd keys export akashi-operator --unarmored-hex --unsafe $KR --yes | \
  ssh agari-box 'umask 077; k=$(cat); printf "keys:\n  - \"%s\"\n" "$k" | sudo tee /opt/pocket/secrets/supplier-keys.yaml >/dev/null; sudo chown 1000:1000 /opt/pocket/secrets/supplier-keys.yaml; sudo chmod 0400 /opt/pocket/secrets/supplier-keys.yaml'
ssh agari-box 'sudo grep -c "^  - \"[0-9a-f]\{64\}\"$" /opt/pocket/secrets/supplier-keys.yaml'   # expect 1
```
- The key never touches the Mac's disk. The file is uid 1000, mode 0400.
- **[KB-FIX]** The section is named `keys`, not `signing_keys`.

### 5.4 `deploy/pocket/compose.yaml` (no `ports`, `networks` or `container_name`)
```yaml
services:
  redis:
    image: redis:8.10.1-alpine
    command: ["redis-server","--maxmemory","192mb","--maxmemory-policy","noeviction","--appendonly","yes","--io-threads","1"]
    volumes: [pocket-redis-data:/data]
    mem_limit: 256m
    healthcheck: { test: ["CMD","redis-cli","ping"], interval: 5s, timeout: 3s, retries: 10 }
    restart: unless-stopped
  miner:
    image: ghcr.io/pokt-network/pocket-relay-miner:v0.1.0
    command: ["miner","--config","/config/config.yaml"]
    volumes:
      - ./miner-config.yaml:/config/config.yaml:ro
      - /opt/pocket/secrets/supplier-keys.yaml:/keys/supplier-keys.yaml:ro
    mem_limit: 256m
    environment: { GOMEMLIMIT: "230MiB", GOMAXPROCS: "1" }
    depends_on: { redis: { condition: service_healthy } }
    healthcheck: { test: ["CMD","curl","-fsS","http://localhost:9092/health"], interval: 10s, timeout: 3s, retries: 30, start_period: 30s }
    restart: on-failure
  relayer:
    image: ghcr.io/pokt-network/pocket-relay-miner:v0.1.0      # SAME tag as the miner, always
    command: ["relayer","--config","/config/config.yaml"]
    volumes:
      - ./relayer-config.yaml:/config/config.yaml:ro
      - /opt/pocket/secrets/supplier-keys.yaml:/keys/supplier-keys.yaml:ro
    expose: ["8080"]
    mem_limit: 256m
    environment: { GOMEMLIMIT: "230MiB", GOMAXPROCS: "2" }
    depends_on: { redis: { condition: service_healthy }, miner: { condition: service_healthy } }
    healthcheck: { test: ["CMD","curl","-fsS","http://localhost:8081/health"], interval: 10s, timeout: 3s, retries: 30, start_period: 20s }   # /health NOT /ready (Traefik drops unhealthy containers)
    restart: unless-stopped
volumes: { pocket-redis-data: {} }
```
**[KB-FIX] vs the skill template:**
- redis 8.4 + allkeys-lru → 8.10.1 + noeviction;
- `:rc` → `v0.1.0`;
- add mem limits and GOMEMLIMIT;
- remove the custom network and container_name;
- add the relayer→miner health dependency.

### 5.5 Configs
`relayer-config.yaml`:
```yaml
listen_addr: "0.0.0.0:8080"
redis: { url: "redis://redis:6379" }
pocket_node:
  query_node_rpc_url: "https://sauron-rpc.beta.infra.pocket.network"
  query_node_grpc_url: "sauron-grpc.beta.infra.pocket.network:443"   # host:port, NO scheme
  grpc_insecure: false
  # NO chain_id (invalid key in the relayer schema)
keys: { keys_file: "/keys/supplier-keys.yaml" }
default_validation_mode: eager
services:
  citation-verify:
    validation_mode: eager
    timeout_profile: fast
    max_body_size_bytes: 4194304
    default_backend: rest
    backends:
      rest:
        url: "http://api.internal:8000/cite"
        health_check: { enabled: true, endpoint: "/v1/health", expected_body: '"ok"', interval_seconds: 10, timeout_seconds: 5, unhealthy_threshold: 3, healthy_threshold: 2 }
  code-reality-check:   # identical, url http://api.internal:8000/code
  live-facts:           # identical, url http://api.internal:8000/now
health_check: { enabled: true, addr: "0.0.0.0:8081" }
metrics: { enabled: true, addr: "0.0.0.0:9090" }
logging: { level: "info", format: "json" }
```
`miner-config.yaml`:
```yaml
redis: { url: "redis://redis:6379" }
pocket_node:
  query_node_rpc_url: "https://sauron-rpc.beta.infra.pocket.network"
  query_node_grpc_url: "sauron-grpc.beta.infra.pocket.network:443"
  chain_id: "pocket-lego-testnet"      # re-check via RPC /status
  grpc_insecure: false
keys: { keys_file: "/keys/supplier-keys.yaml" }
block_time_seconds: 30                 # Beta (measured 30.4 s)
balance_monitor: { enabled: true, check_interval_seconds: 300, balance_threshold_upokt: 100000000 }
metrics: { enabled: true, addr: "0.0.0.0:9092" }
logging: { level: "info", format: "json" }
```
**Validate locally** with the relay-miner repo's public, unstaked example key: `docker run --rm -v "$PWD/deploy/pocket:/config:ro" -v <example-key>:/keys/supplier-keys.yaml:ro ghcr.io/pokt-network/pocket-relay-miner:v0.1.0 relayer validate --config /config/relayer-config.yaml`, and the same for `miner validate`.

### 5.6 Coolify resources
| # | Resource | Type | Base / file | Port | Domain | Alias | mem |
|---|---|---|---|---|---|---|---|
| 1 | app-redis | one-click Redis (`maxmemory 128mb`, allkeys-lru) | – | 6379 | none | uuid host | 160m |
| 2 | ts-introspect | Dockerfile `/services/ts-introspect/Dockerfile` | / | 3000 | none | `ts-introspect.internal` | 256m |
| 3 | api | Dockerfile `/services/api/Dockerfile` | / | 8000 | `https://api.<d>` | **`api.internal`** | 768m |
| 4 | worker | Dockerfile `/services/worker/Dockerfile` | / | 8010 (`/health`) | none | – | 384m |
| 5 | pocket | Docker Compose, base `/deploy/pocket`, file `/compose.yaml` | | – | **Domains for relayer: `https://relay-beta.<d>:8080`** | – | per compose |
| 6 | web | Docker Image `ghcr.io/<owner>/akashi-web:<sha>` | | 3000 | `https://<d>` | – | 320m |
| 7 | docs | Docker Image `ghcr.io/<owner>/akashi-docs:<sha>` | | 3000 | `https://docs.<d>` | – | 192m |

- **pocket Advanced:** **Connect To Predefined Network ON**, **Preserve Repository ON**, Gzip OFF, Auto Deploy OFF.
- **api:** Gzip OFF.
- **Env via `coolify app env sync <uuid> --file <gitignored file>`:**
  - api: `AKASHI_ENV`, `AKASHI_REDIS_URL`, `AKASHI_TS_INTROSPECT_URL=http://ts-introspect.internal:3000`, `AKASHI_PUBLIC_BASE_URL`, `AKASHI_DEMO_HOST`, the `AKASHI_*_MAILTO` values, optional tokens, `AKASHI_NLI_MODEL_PATH`, `PYTHONTZPATH=` (empty), `AKASHI_LOG_LEVEL`.
  - web: `AKASHI_API_INTERNAL_URL=http://api.internal:8000`, `POCKET_PORTAL_URL`, `POCKET_NETWORK=eip155:84532`, `REDIS_URL`, `OPENAI_API_KEY`, `AI_MODEL`, `AI_GATEWAY_API_KEY`, `DEMO_WALLET_PRIVATE_KEY`.
- **Deploy order (each [OK?]):**
  1. app-redis
  2. ts-introspect
  3. api — verify:
     - `/cite/v1/version` and the others;
     - `curl -sI https://api.<d>/cite` → 2xx;
     - `lint_backend.py --base-url https://api.<d>/cite --card ... --bad "POST /v1/verify notjson"`;
     - the chunked-body curl.
  4. worker
  5. register the IDs (§3)
  6. pocket
  7. web / docs

### 5.7 Verify the pocket stack
```bash
ssh agari-box 'docker ps --format "{{.Names}}\t{{.Status}}" | grep -E "^(redis|miner|relayer)-"'
R=$(ssh agari-box 'docker ps --format "{{.Names}}" | grep ^relayer-'); M=${R/relayer-/miner-}; D=${R/relayer-/redis-}
ssh agari-box "docker exec $R getent hosts redis api.internal"
ssh agari-box "docker exec $R curl -s -o /dev/null -w '%{http_code}\n' localhost:8081/ready"
ssh agari-box "for s in citation-verify code-reality-check live-facts; do docker exec $R curl -s localhost:8081/ready/\$s; done"
ssh agari-box "docker exec $R curl -s http://api.internal:8000/cite/v1/health"
ssh agari-box "docker exec $D redis-cli CONFIG GET maxmemory-policy"          # noeviction
ssh agari-box "docker exec $R pocket-relay-miner relayer validate --config /config/config.yaml --check-stake"
curl -sv https://relay-beta.<d>/ -o /dev/null 2>&1 | grep -E 'HTTP/|issuer|expire'   # 400 is fine; LE cert
curl -s -o /dev/null -D - -H 'Accept-Encoding: gzip' https://relay-beta.<d>/ | grep -i content-encoding   # must print nothing
```
- **Caveat:** under a predefined network, Coolify may rename hosts to `<service>-<uuid>`.
  - Fallback A: `redis://redis-<pocket-uuid>:6379`.
  - Fallback B: turn the predefined network off and point the backends at `https://api.<d>/cite`.

## 6. Test apps, relays, claims, audit
- **App stakes (3 × [OK?]):** `deploy/pocket/app_stake.<id>.yaml` with `stake_amount: 1100000000upokt` and `service_ids: [<id>]` (exactly one). Stake the apps right after the supplier. Re-staking needs a strictly higher amount.
  ```bash
  pocketd tx application stake-application --config deploy/pocket/app_stake.citation-verify.yaml --from akashi-app-cite $TXF   # [OK?]
  ```
- **Delegation:** not needed for pocket-ap or A7. Ask the organizers which gateway serves the test portal, then `delegate-to-gateway` if needed ([OK?], gas only, ≤ 7 gateways). Only `stake-and-delegate` reads the config's `gateway_addresses`.
- **pocket-ap config** (`deploy/pocket/pocket-ap.<id>.yaml`): `network: beta`, `listeners: [{addr: 127.0.0.1:8550, service_id: <id>, rpc_type: rest}]`, and **no `app`/`apps` keys** (the key comes from `POCKET_APP_PRIVATE_KEY`). **[KB-FIX]**
- **Relays**, once a session with both supplier and app active is confirmed (MCP `session_check` or `query_state.py --session`):
  ```bash
  export POCKET_APP_PRIVATE_KEY=$(pocketd keys export akashi-app-cite --unarmored-hex --unsafe $KR --yes)   # APP key, never operator
  pocket-ap call --config deploy/pocket/pocket-ap.citation-verify.yaml --service citation-verify --rpc-type rest -X GET --path /v1/version -v
  pocket-ap call ... -X POST --path /v1/verify -H 'Content-Type: application/json' -d '{"citations":["Obergefell v. Hodges, 576 U.S. 644 (2015)"]}' -v --compare https://api.<d>/cite
  for i in $(seq 1 15); do pocket-ap call ... >/dev/null; done; unset POCKET_APP_PRIVATE_KEY
  ```
  - Pass: stdout starts with `{`; stderr shows `endpoints: N in session, M support rest` and `attempt 1: <OP> ... -> ok`; exit code 0.
  - **Relay each service in a different session**, so each gets its own `MsgCreateClaim`.
- **Claims:** the claim lands at session end + 12–22 blocks and **settles at end + 33** (~17 min). Worst case ~40–45 min from stake. The LCD drops settled claims, so the **indexer** is the truth:
  ```bash
  curl -s https://data.beta.pocket.network/graphql -H 'Content-Type: application/json' -d "$(jq -n --arg s "$OP" --arg svc "citation-verify" \
  '{query:"query($s:String!,$svc:String!){ msgCreateClaims(filter:{supplierId:{equalTo:$s},serviceId:{equalTo:$svc}}, orderBy: SESSION_END_HEIGHT_DESC, first:5){ nodes { transactionId applicationId sessionEndHeight numRelays claimedAmount block { id timestamp } } } eventClaimSettleds(filter:{supplierId:{equalTo:$s},serviceId:{equalTo:$svc}}, orderBy: SESSION_END_HEIGHT_DESC, first:5){ totalCount nodes { sessionEndHeight numRelays settledAmount proofValidationStatus block { id timestamp } } } }", variables:{s:$s,svc:$svc}}')" | jq
  pocketd query tx --type=hash <CLAIM_TX> --network=beta
  ```
  - Choose a `transactionId` whose `applicationId` is that service's app and whose `sessionEndHeight` appears in `eventClaimSettleds`. Also record the `msgSubmitProofs` tx.
- **Audit:**
  ```bash
  curl -s "https://mcp.pocketmcp.network/api/audit?network=beta&ids=citation-verify,code-reality-check,live-facts&operator=$OP" | jq '.summary, (.services[] | {id, verdict, rules})'
  python3 $PSB/scripts/audit_services.py --manifest deploy/submission.json --json deploy/audit/audit-beta-$(date +%F).json
  ```
  - Target A1–A7 PASS; explain any A8/A9 warns.
  - `deploy/submission.json` uses schema `pocket-service-submission/v1`.
  - Commit the audit JSON and the lint outputs.

## 7. Testnet portal listing
- **What the KB says:** the only documented listing process is for MainNet: email **directors@pokt.foundation** with IDs, network, operator, one line per service and the audit output. The portal's `outputSchema`/`inputSchema`/`methods`/`example` live in PNF's registry entry (off-chain).
- **What it doesn't say:** nothing documents how Beta services reach `test.agent.pocket.network`.
- **Send** (Discord hackathon channel + directors@ + portal@pokt.foundation) a package per service at `cards/<id>/registry.json`:
  - serviceId, displayName, description in house style (ending "Pay per request in USDC; no account, no API key."), category, `protocols:["rest"]`;
  - `methods` (unprefixed);
  - inputSchema and a 2020-12 outputSchema **with `properties`**;
  - one example.
  - Plus: the audit JSON, `$OP`, `sage-service.yaml` (passthrough, `rest`, `relay_timeout: 30s`, version and health checks, no sync_check) and the repo link.
- **Questions:**
  1. Is the staging app `test.agent.pocket.network`? How are Beta services added, and who receives the schemas?
  2. Which gateway serves the test portal? Should our apps delegate to it?
  3. Will gateways add our REST services to SAGE?
  4. Is the Test Transaction ID a MsgCreateClaim? Is a batched claim tx OK?
  5. Is one endpoint for 3 submissions OK?
  6. Can we get more faucet POKT if needed?

## 8. Updates, rollback, monitoring
- **Card change:**
  1. Validate, then MCP `card_diff`.
  2. **[OK?]** `add-service <id> "<Name>" <live CUPR> --card-file ...` (re-read the live name and CUPR first).
  3. `encode_card.py diff` → identical.
  4. Re-audit.
  - Prefer `add-service` over batch `edit-service`.
  - Roll back by republishing the previous tagged card.
- **Supplier re-stake:** always list **all three** services. Use `--services-only` (operator) or `--stake-only`. Never unstake before judging ends (86 sessions ≈ 14.5 h to unbond).
- **Relayer or miner config change:**
  1. Validate locally.
  2. **[OK?]** `coolify deploy uuid <pocket>`. There is no rolling update for Compose; Redis keeps its AOF.
  3. Re-run §5.7.
  4. A new service needs a relayer entry, a redeploy and a full re-stake.
- **Images:** bump miner and relayer together. Never `:rc`/`:latest`. Never roll back below v0.1.0 while proofs are pending.
- **Never:**
  - delete the `pocket-redis-data` volume;
  - tick "delete volumes";
  - run `docker volume prune`;
  - enable server-level unused-volume cleanup;
  - point the relay stack at app-redis;
  - publish ports 8081 / 9090 / 9092 / 6379.
- **Daily monitoring:**
  - MCP `supplier_status`, `claims`, `audit_services`, `balance`;
  - `free -h` and `docker stats`;
  - miner error logs and the balance monitor;
  - `ha_relayer_relays_rejected_total`.
  - Keep the operator above 100 POKT.
  - Optional 4 GB swapfile [OK?].

## 9. Submission checklist (one form per service)
| Field | Source |
|---|---|
| Name / Email / Discord | the user |
| Service Name | `show-service <id> -o json \| jq -r .service.name` |
| Service Description | card description, rewritten to sell: problem → what it verifies → typed verdicts → provenance → "every response is JSON" |
| Testnet Service ID | `citation-verify` / `code-reality-check` / `live-facts` |
| Endpoint URL | `https://relay-beta.<d>` (from `show-supplier $OP`) |
| Test Transaction ID | that service's settled **MsgCreateClaim** txhash; fallbacks listed in the README |
| Repository Link | public repo with source, Dockerfiles, `cards/`, OpenAPI, `deploy/` (no keys), lint outputs, audit JSON, tx hashes |
| How should judges test | portal URL / portal MCP, free demo on the web app, a pocket-ap example, curl + expected output, the audit link |
| Category | citation-verify → **Research tool**; code-reality-check → **Utility Service**; live-facts → **Data service** |

**Pre-submit gates:** audit has no FAIL; lint passes ×3; a settled claim per service; the repo is public; spec URLs resolve; listing status is known.

## 10. `ids-and-txs.md` layout
Sections:
- **Environment:** pocketd version, chain_id, live params with dates.
- **Accounts:** role, key name, address, funded tx, notes.
- **Services:** id, name, CUPR, card sha256, add-service tx, height, updates.
- **Supplier:** stake tx, amount, endpoint, activation height.
- **App stakes.**
- **Relays and claims:** per service, session end, #relays, claim tx, settled?, proof tx, chosen Test Tx.
- **Coolify:** resource, uuid, type, domain, alias, mem, last deploy.
- **DNS/TLS.**
- **Audit runs.**
- **Organizer comms.**
- **Submission.**

Public values only; **no keys or mnemonics**.

## [KB-FIX] summary
1. redis 8.4 + allkeys-lru → 8.10.1 + noeviction.
2. `:rc` → pinned v0.1.0 (miner = relayer).
3. `block_time_seconds` 60 → **30** (Beta).
4. Remove the relayer `chain_id`.
5. Relayer `health_check.enabled: true`, plus `default_validation_mode: eager` and `expected_body`.
6. `/health` for the container healthcheck (`/ready` is for readiness checks).
7. Remove custom networks, container_name, loopback ports and Caddy (use Traefik).
8. Use the web faucet.
9. `--gas auto` instead of `--fees`; app stake = min + 10%.
10. pocket-ap: no app/apps keys.
11. Positional `add-service`.
12. The MainNet fee equals Beta (1,000 POKT).
13. Settlement ≈ 17 min after session end (40–45 min worst case).
14. The `/cite` prefix in the backend URL is deliberate.
15. ~~Brand IDs~~ settled: capability IDs.
16. `test` keyring is for Beta only.
17. Add `--yes` + `--keyring-backend` to key exports.

## GHCR workflow (`.github/workflows/images.yml`, matrix web + docs)
```yaml
name: images
on:
  push: { branches: [main], paths: ["apps/**", "packages/api-client/**", "packages/brand/**", "packages/model/**", "pnpm-lock.yaml", ".github/workflows/images.yml"] }
  workflow_dispatch:
permissions: { contents: read, packages: write }
concurrency: { group: images, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    strategy: { matrix: { app: [web, docs] } }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/<owner-lowercase>/akashi-${{ matrix.app }}
          tags: |
            type=sha,format=short,prefix=sha-
            type=raw,value=main
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/${{ matrix.app }}/Dockerfile
          platforms: linux/amd64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha,scope=${{ matrix.app }}
          cache-to: type=gha,mode=max,scope=${{ matrix.app }}
          build-args: |
            NEXT_PUBLIC_SITE_URL=${{ vars.NEXT_PUBLIC_SITE_URL }}
            NEXT_PUBLIC_DOCS_URL=${{ vars.NEXT_PUBLIC_DOCS_URL }}
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${{ vars.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID }}
```
- Check the action major versions in their docs before use.
- Make the GHCR packages public, or add registry credentials in Coolify.
- Deploy from the Mac with `coolify deploy uuid`.
