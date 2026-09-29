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
