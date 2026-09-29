# Acceptance / evidence ledger

Every tx, claim, audit run and deploy, in order. **Failed attempts stay in.**

| UTC | Stage | Scenario | Network | Hash / ref | Result | Artifact |
|---|---|---|---|---|---|---|
| 2026-09-29 12:34 | S0 | Private GitHub repo created + pushed | – | github.com/Blockchain-Oracle/akashi | ok | – |
| 2026-09-29 12:34 | S0 | Coolify project + read-only deploy key | Coolify | project 43kqbdz2…, key 7izaxr1x… | ok (first project create 422 on non-ASCII description) | – |
| 2026-09-29 13:10 | S1 | app-redis created, redis_conf applied, restarted | Coolify | wr4snhvj… | ok (CONFIG GET → allkeys-lru, 134217728) | – |
| 2026-09-29 13:14 | S1 | akashi-api deployed (a28f4f6) | Coolify | deployment wfikzbrr… | ok: probes 200, 404 JSON, no gzip, 39 MiB RSS, redis ping True | – |
