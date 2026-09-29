# S3 — code-reality-check

**Plan:** `00-plan.md` §7 · **Open first:** specs/backend.md §3.2, §9 code

## Steps
- [x] Models; npm + PyPI → /v1/package (+ /v1/packages)
- [x] Top lists (loaded at api startup, disk-cached weekly; worker job later) + placeholder/typosquat/suspicious_new
- [x] Other registries (cargo, go, maven, rubygems, packagist, nuget) + deps.dev history + /packages + /versions (range resolution: npm/cargo semver, PEP 440, exact)
- [x] Python wheel range reads + AST index + stdlib via typeshed stubs
- [x] Go via pkg.go.dev v1 (zip fallback not needed so far)
- [x] Rust (docs.rs rustdoc JSON, format 61, projected + cached per crate version)
- [x] ts-introspect (TypeScript 6.0.3) — deployed internal-only
- [x] /symbol(s) with pending + background completion
- [x] /check via tree-sitter (python, typescript/tsx, javascript, go, rust)
- [x] Schema (`uv run akashi-schemas` → cards/code-reality-check/{output-schema,input-schema,openapi}.json; 8/8 live bodies incl. 404/422 validate under Draft 2020-12) + functional probe (axios@1.7.9 AxiosInstance.fetchJson → no) · pre-warm job → S5 worker

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
- **stdlib (typeshed):** os.path.join → yes (3 overloads) · os.path.joinx → no, did_you_mean join (names from `from posixpath import *`) · asyncio.TaskGroup.create_task → yes · json.loads → yes (3 ms). Local stubs get a larger module budget (96) than network wheels (16). typeshed yields module names as **str** (a `".".join()` on them silently broke the map; caught by the live check).
- **Go (pkg.go.dev v1):** `/v1beta` now 301 → use `/v1`. `filter` is a **Go expression** (`name == "X"`, `hasPrefix(name, "T.")`, `contains(name, ".") == false`), not a regex; paging param is `token`; empty `items` come back as **null**. Results: gin v1.10.0 Context.AbortWithError → `func (c *Context) AbortWithError(code int, err error) *Error` · AbortWithErr → no (AbortWithError, AbortWithStatus) · Contxt.JSON → no (Context) · x/time/rate NewLimiter → yes.
- **Rust (docs.rs):** anyhow 1.0.86 → **unknown / rustdoc_json_unavailable** (pre-2025 build, confirmed) · latest 1.0.104 `Error::context` → `fn context<C>(self, context: C) -> Self` · `Result` → `type Result<T, E = Error> = core::result::Result<T, E>` · `Error::contxt` → no (context) · `Eror::msg` → no (Error) · itoa `Buffer::format` → `fn format<I>(&mut self, i: I) -> &str` · serde_json `from_str` → `fn from_str<'a, T>(s: &'a str) -> …` · missing crate → not_found. Warm ≈ 200 ms.
- ⚠️ The Mac ran out of disk mid-session (ENOSPC, 265 MB free). Cause: pre-existing disk use plus ~1.8 GB of research-agent leftovers in the session scratchpad; the leftovers were deleted (12 GB free after). Tell the user.
- **npm (ts-introspect):** axios 1.7.9 `AxiosInstance.getUri` → `getUri(config?: AxiosRequestConfig<any> | undefined): string`, `fetchJson` → no · zod `z.string` → yes (namespace re-export; the research prototype missed it) · express via @types · lodash `debounce` (export=), `_.chunk` (alias) · date-fns · react `useState` · left-pad (export= function) · next/server `NextResponse.json` → **static** `json<JsonBody>(body, init?)`, `after<T>`, `jsonx` → no.
- **Bugs found by live checks and fixed:** export= modules answered "no" (lodash) → use the export= value; date-fns 10.9 MB unpacked but 1.6 MB gzip → the size threshold was wrong; a jsDelivr crawl capped at 200 files / 45 s gave **false "no"** on next → replaced by **streaming tar extraction** (only .d.ts kept; complete; next ~7 s) + "never answer no from an incomplete or unresolved view" (unknown instead); next's self-referencing imports (`next/dist/...`); static members must win over inherited instance members.
- `resolveExternalModuleSymbol` is not public API in TS 6; `erasableSyntaxOnly` forbids parameter properties (Node runs .ts directly).
- Program LRU = 4 (one next@15 program ≈ 150 MB RSS); container 512m, `--max-old-space-size=384`.
- **Deploy:** 3 clones failed with 'Permission denied (publickey)' right after a successful ls-remote. The key cloned fine from the Mac and the server, and a sequential retry succeeded → transient. Retry once before debugging.
- `data/` (toplist cache) was committed by mistake → removed and gitignored.
- **/v1/check live (one call per snippet):** Python → `reqeusts` nonexistent_package (did you mean requests), `s.mountx` nonexistent_symbol (mount) via `s = requests.Session()` inference, `os.path.joinx` (join), real signatures for numpy/pandas · TypeScript → react-codeshift placeholder, `axios.fetchJson` no, `z.strng` (string), node:fs builtins skipped · Go → `gin.NewEngine` no (did you mean Engine), fmt/gin signatures · Rust → `serde_json::from_strx` (from_str); fully-qualified crate paths bind their crate implicitly.
- JS instance inference is `new X()` only: a call result (axios.create()) has an unknown type, so it is not guessed.
- Bug found: node builtin + named import produced a symbol lookup with an empty package → 500 → builtins skip symbol checks.
- ⚠️ **Prod incident:** the `.gitignore` `data/` rule (meant for the root runtime cache) also matched `akashi_code/data/`, so `py_import_map.json` never reached git; the api crash-looped after deploy while Coolify said "finished". Fixed by anchoring `/data/`. New rule: verify container health + a live request after every deploy.
- Startup loads the top lists before the port opens (health waits for them). Test scripts must poll `/v1/health` rather than sleep.

## Handoff
- **S3 done** (2026-09-29). Live on the temp URL; ts-introspect internal. Open: pre-warm job (S5 worker); cold-path perf review (S6).
