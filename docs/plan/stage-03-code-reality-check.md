# S3 — code-reality-check

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.2, §9 code

## Steps
- [x] Models; npm + PyPI → /v1/package (+ /v1/packages)
- [x] Top lists (loaded at api startup, disk-cached weekly; worker job later) + placeholder/typosquat/suspicious_new
- [x] Other registries (cargo, go, maven, rubygems, packagist, nuget) + deps.dev history + /packages + /versions (range resolution: npm/cargo semver, PEP 440, exact)
- [x] Python wheel range reads + AST index (typeshed stdlib still to do)
- [ ] Go (pkgsite → zip fallback)
- [ ] Rust (docs.rs rustdoc JSON)
- [ ] ts-introspect (TypeScript 6.0.3)
- [ ] /symbol(s) with pending + background completion
- [ ] /check via tree-sitter
- [ ] Pre-warm job, schema, probe

## Gate
axios fetchJson→no / getUri→yes+sig; zod z.string→yes; react-codeshift & huggingface-cli→placeholder; left-padx→likely_typo; requests Session.mount→yes; gin AbortWithError sig; anyhow→unknown; next@15 pending→warm.

## Findings
- **Live results (2026-09-29):** react-codeshift → placeholder (description) · huggingface-cli → placeholder (0.0.1-security + description) · left-padx → does_not_exist, typo_of left-pad (d=1) · pypi reqeusts → does_not_exist, typo_of requests · requestz-ultra → does_not_exist · axios@1.7.9 → ok · axios@99.0.0 → ok + version_exists=no (latest 1.20.0) · requests 2.32.3 → ok · left-pad → deprecated ("use String.prototype.padStart()") · expresss → likely_typo of express (rank 262).
- react-codeshift is 1,124 B / 3 files, **just above** the tiny-package threshold; it is caught by the description signal. Multiple signals are needed.
- Dependency conflict: `limits` requires `packaging<26` → `packaging>=25`.
- Cache: the value must be JSON-native (SourceRef → `model_dump`). The first call for left-pad took 2,898 ms; the cached repeat took **2 ms**.
- Invalid JSON → 400 `invalid_json` ✅ and a bad enum → 422 with field details ✅ (closes the S1 open item).
- **All 8 ecosystems live:** serde 316 versions (first 2014-12-05), gin 28 releases, guava 158, rails 521, laravel/framework 1,296, Newtonsoft.Json 86; missing names → does_not_exist; malformed Maven name → 422. serde cold took 4.4 s (large deps.dev history), inside the 7 s budget, cached after → revisit in S6 perf.
- **Ranges:** axios ^1.7.0 → 1.20.0 · requests >=2,<3 → 2.34.2 · serde ^1.0.100 → 1.0.229 · gin ^1.9.0 → v1.12.0 · axios ^9 → none (with evidence).
- **Version ordering bug found and fixed:** "newest first" by publish date put backports first (axios 0.34.0, rails 7.2.4); Go listed pseudo-versions. Now whichever grammar (semver / PEP 440) parses more versions orders them; Go pseudo-versions are filtered. NuGet/cargo `latest` = newest stable (NuGet was reporting 14.0.1-beta2).
- **Python symbols live (wheel range reads, no full download):** requests 2.32.3 `Session.mount` → yes `def mount(self, prefix, adapter)` via the `from .sessions import Session` re-export · `Session.mountx` → no, did_you_mean `mount` · `requests.get` → `def get(url, params=None, **kwargs)` · pandas 2.2.3 `DataFrame.to_markdown` → full typed signature (frame.py 447 KB read out of a 12.7 MB wheel in 0.21 s) · `to_markdownx` → no after walking in-package bases (3.3 s cold) · numpy 2.1.3 `linalg.norm` → yes from the **.pyi** stub · requests@99.0.0 → package_or_version_not_found · httpx (no version) → latest 0.28.1, `async def get(...)`.
- PyPI's CDN returns **416** for a suffix range larger than the file (requests wheel is 64,928 B): ranges are explicit (`bytes=start-end`) using the size from the PyPI JSON. Large wheels need a 2nd read for the central directory (pandas, numpy).
- Startup loads the top lists before the port opens (health waits for them). Test scripts must poll `/v1/health` rather than sleep.

## Handoff
