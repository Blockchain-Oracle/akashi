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
