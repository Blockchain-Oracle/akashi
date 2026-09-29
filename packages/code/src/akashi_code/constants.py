"""code-reality-check constants (specs/backend.md §3.2; sources-code-reality-check.md for measurements)."""

from datetime import timedelta
from typing import Final

from akashi_core.http.registry import UpstreamSpec

SERVICE_KIND_PACKAGE: Final = "package"

# --- upstreams (limits from the research; see specs/backend.md §2.5 table) ---
NPM_REGISTRY = UpstreamSpec(
    "npm",
    "https://registry.npmjs.org",
    max_concurrency=20,
    total_s=2.0,
    http2=True,
    licence="npm registry metadata",
    attribution="registry.npmjs.org",
)
NPM_DOWNLOADS = UpstreamSpec(
    "npm-downloads", "https://api.npmjs.org", max_concurrency=20, total_s=2.0, attribution="api.npmjs.org"
)
PYPI = UpstreamSpec(
    "pypi", "https://pypi.org", max_concurrency=10, total_s=2.5, http2=True, attribution="pypi.org JSON API"
)
DEPS_DEV = UpstreamSpec(
    "deps.dev",
    "https://api.deps.dev",
    max_concurrency=5,
    total_s=2.0,
    licence="CC-BY-4.0",
    attribution="Data: deps.dev (CC-BY 4.0)",
)

CRATES_INDEX = UpstreamSpec(
    "crates-index",
    "https://index.crates.io",
    max_concurrency=10,
    total_s=2.0,
    attribution="index.crates.io (sparse index)",
)
GO_PROXY = UpstreamSpec(
    "go-proxy", "https://proxy.golang.org", max_concurrency=8, total_s=2.5, attribution="proxy.golang.org"
)
MAVEN_CENTRAL = UpstreamSpec(
    "maven-central", "https://repo1.maven.org", max_concurrency=5, total_s=2.0, attribution="Maven Central"
)
RUBYGEMS = UpstreamSpec(
    "rubygems",
    "https://rubygems.org",
    max_concurrency=10,
    total_s=2.0,
    rate="10/second",
    attribution="rubygems.org API",
)
PACKAGIST = UpstreamSpec(
    "packagist", "https://repo.packagist.org", max_concurrency=10, total_s=2.5, attribution="Packagist p2"
)
NUGET = UpstreamSpec("nuget", "https://api.nuget.org", max_concurrency=5, total_s=2.0, attribution="nuget.org")

PYPI_FILES = UpstreamSpec(
    "pypi-files",
    "https://files.pythonhosted.org",
    max_concurrency=10,
    total_s=4.0,
    http2=True,
    attribution="files.pythonhosted.org (wheel range reads)",
)

PKGSITE = UpstreamSpec(
    "pkgsite", "https://pkg.go.dev", max_concurrency=8, total_s=2.5, rate="40/second", attribution="pkg.go.dev API (v1)"
)  # documented limit: 45 QPS per IP block

DOCS_RS = UpstreamSpec("docs.rs", "https://docs.rs", max_concurrency=3, total_s=3.0, attribution="docs.rs rustdoc JSON")

# deps.dev system names for publish history (RubyGems and Packagist are not covered by deps.dev).
DEPS_DEV_SYSTEMS: Final = {
    "npm": "npm",
    "pypi": "pypi",
    "go": "go",
    "maven": "maven",
    "cargo": "cargo",
    "nuget": "nuget",
}

# --- request limits ---
MAX_PACKAGE_NAME_CHARS: Final = 214  # npm's documented maximum name length
MAX_VERSION_CHARS: Final = 128
MAX_PACKAGES_PER_REQUEST: Final = 100
PACKAGES_CONCURRENCY: Final = 20

# --- verdict thresholds (research §4; the 1,000 downloads threshold is an inference) ---
TYPO_MAX_DISTANCE: Final = 2
TYPO_SHORT_NAME_LEN: Final = 5  # names this short allow only distance 1
TYPO_SHORT_MAX_DISTANCE: Final = 1
TYPO_POPULARITY_RATIO: Final = 100  # target must be ≥100× more popular than the candidate
SUSPICIOUS_NEW_DAYS: Final = 90
SUSPICIOUS_MAX_WEEKLY_DOWNLOADS: Final = 1_000
SUSPICIOUS_MAX_VERSIONS: Final = 2
DID_YOU_MEAN_LIMIT: Final = 5
VERSIONS_TAIL: Final = 10
VERSIONS_LIST_MAX: Final = 200  # /v1/versions returns at most this many, newest first
MAX_RANGE_CHARS: Final = 256

# --- placeholder / defensive-package detection ---
NPM_SECURITY_HOLDING_VERSION_RE: Final = r"^0\.0\.1-security(\.\d+)?$"
NPM_TINY_UNPACKED_BYTES: Final = 1_024
NPM_TINY_FILE_COUNT: Final = 2
PLACEHOLDER_PATTERNS: Final = (
    "placeholder",
    "security holding package",
    "prevent dependency confusion",
    "dependency confusion",
    "name squat",
    "reserved",
    "do not use",
)

# --- popularity reference lists ---
NPM_TOPLIST_URL: Final = "https://cdn.jsdelivr.net/npm/npm-high-impact@1/lib/top.js"  # MIT
PYPI_TOPLIST_URL: Final = "https://hugovk.github.io/top-pypi-packages/top-pypi-packages.min.json"
TOPLIST_REFRESH: Final = timedelta(days=7)

# --- cache TTLs (specs/backend.md §2.6) ---
TTL_VERSION: Final = timedelta(hours=1)
TTL_LATEST: Final = timedelta(minutes=10)
TTL_MISSING: Final = timedelta(minutes=5)  # a squatter may register the name any minute
TTL_DOWNLOADS: Final = timedelta(hours=24)

# --- symbols ---
MAX_SYMBOL_CHARS: Final = 300
MAX_SYMBOLS_PER_REQUEST: Final = 50
REEXPORT_MAX_DEPTH: Final = 4
MAX_MODULES_PER_LOOKUP: Final = 16  # network-backed (wheel range reads)
MAX_MODULES_PER_LOOKUP_LOCAL: Final = 96  # disk-backed stubs (stdlib via typeshed): cheap reads
CLASS_BASE_MAX_DEPTH: Final = 3
TTL_SYMBOLS: Final = None  # immutable (package, version) → cache forever (LRU-evicted only)
WHEEL_PLATFORM_PREFERENCE: Final = ("py3-none-any", "py2.py3-none-any", "cp313-cp313-manylinux", "abi3-manylinux")
PKGSITE_SIBLINGS_LIMIT: Final = 200  # names fetched for did-you-mean when a symbol is missing
RUSTDOC_MAX_DECOMPRESSED_BYTES: Final = 64 << 20  # 64 MiB cap on decompressed rustdoc JSON
RUSTDOC_FORMAT_MIN: Final = 39  # oldest rustdoc JSON format this projector understands
RUSTDOC_FORMAT_MAX: Final = 99  # guard against incompatible future formats
RUSTDOC_MAX_MODULE_DEPTH: Final = 6
TS_INTROSPECT_TOTAL_S: Final = 5.0  # a cold build beyond this answers `pending` and finishes in the background
TS_INTROSPECT_BACKGROUND_S: Final = 60.0
RETRY_AFTER_MS: Final = 3_000
