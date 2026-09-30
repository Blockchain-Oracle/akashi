"""Request/response models for code-reality-check."""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from akashi_code.constants import (
    MAX_CHECK_CODE_BYTES,
    MAX_CHECK_PINS,
    MAX_PACKAGE_NAME_CHARS,
    MAX_PACKAGES_PER_REQUEST,
    MAX_RANGE_CHARS,
    MAX_SYMBOL_CHARS,
    MAX_SYMBOLS_PER_REQUEST,
    MAX_VERSION_CHARS,
)
from akashi_core.contract.enums import Tristate
from akashi_core.contract.fields import UntrustedStr

# Names and versions go into registry URLs: every ecosystem's are printable ASCII without spaces (npm scopes,
# Maven group:artifact and Go module paths included). Fuzzing sent a control character → InvalidURL → 500.
PRINTABLE_TOKEN = r"^[!-~]+$"
PRINTABLE_TEXT = r"^[ -~]+$"  # a version range may contain spaces ("^1.2 || >=2")
PackageName = Annotated[str, Field(min_length=1, max_length=MAX_PACKAGE_NAME_CHARS, pattern=PRINTABLE_TOKEN)]
VersionText = Annotated[str, Field(min_length=1, max_length=MAX_VERSION_CHARS, pattern=PRINTABLE_TOKEN)]


class Ecosystem(StrEnum):
    npm = "npm"
    pypi = "pypi"
    cargo = "cargo"
    go = "go"
    maven = "maven"
    rubygems = "rubygems"
    packagist = "packagist"
    nuget = "nuget"


class PackageVerdict(StrEnum):
    ok = "ok"
    does_not_exist = "does_not_exist"
    placeholder = "placeholder"
    likely_typo = "likely_typo"
    suspicious_new = "suspicious_new"
    deprecated = "deprecated"
    yanked = "yanked"
    unknown = "unknown"


class PackageQuery(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"ecosystem": "npm", "name": "react-codeshift"}]})

    ecosystem: Ecosystem
    name: PackageName
    version: VersionText | None = None


class PackagesRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "items": [
                        {"ecosystem": "npm", "name": "left-padx"},
                        {"ecosystem": "pypi", "name": "reqeusts"},
                        {"ecosystem": "npm", "name": "axios", "version": "1.7.9"},
                    ]
                }
            ]
        }
    )

    items: list[PackageQuery] = Field(min_length=1, max_length=MAX_PACKAGES_PER_REQUEST)


class TypoTarget(BaseModel):
    name: str
    distance: int
    method: str  # "damerau_levenshtein" | "generator:<kind>"
    target_rank: int | None = None


class PackageResult(BaseModel):
    kind: Literal["package"] = "package"
    ecosystem: Ecosystem
    name: str
    version: str | None = None
    verdict: PackageVerdict
    exists: Tristate
    risk_signals: list[str] = Field(default_factory=list)
    typo_of: TypoTarget | None = None
    did_you_mean: list[str] = Field(default_factory=list)
    latest: str | None = None
    version_exists: Tristate = Tristate.unknown
    deprecated: bool = False
    deprecated_reason: UntrustedStr | None = None
    yanked: bool = False
    yanked_reason: UntrustedStr | None = None
    description: UntrustedStr | None = None
    first_published: str | None = None
    latest_published: str | None = None
    versions_count: int | None = None
    downloads_last_week: int | None = None
    popularity_rank: int | None = None
    versions_tail: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    see_also: list[str] = Field(default_factory=list)
    retryable: bool = False


class VersionsQuery(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"examples": [{"ecosystem": "npm", "name": "axios", "range": "^1.7.0"}]}
    )

    ecosystem: Ecosystem
    name: PackageName
    range: str | None = Field(default=None, min_length=1, max_length=MAX_RANGE_CHARS, pattern=PRINTABLE_TEXT)


class VersionsResult(BaseModel):
    kind: Literal["versions"] = "versions"
    ecosystem: Ecosystem
    name: str
    exists: Tristate
    range: str | None = None
    resolved: str | None = None  # highest version satisfying `range` (None if nothing matches)
    range_syntax: str | None = None  # which rules were applied: npm | cargo | pep440 | exact
    dist_tags: dict[str, str] = Field(default_factory=dict)
    versions: list[str] = Field(default_factory=list)  # newest first
    truncated: bool = False
    evidence: list[str] = Field(default_factory=list)
    retryable: bool = False


SymbolName = Annotated[str, Field(min_length=1, max_length=MAX_SYMBOL_CHARS)]


class SymbolQuery(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"ecosystem": "npm", "package": "axios", "version": "1.7.9", "symbol": "fetchJson"}]
        }
    )

    ecosystem: Ecosystem
    package: PackageName
    version: VersionText | None = None
    symbol: SymbolName


class SymbolsQuery(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"ecosystem": "pypi", "package": "requests", "symbols": ["get", "Session.mount", "fetch_json"]}
            ]
        }
    )

    ecosystem: Ecosystem
    package: PackageName
    version: VersionText | None = None
    symbols: list[SymbolName] = Field(min_length=1, max_length=MAX_SYMBOLS_PER_REQUEST)


class SymbolSuggestion(BaseModel):
    """A real name close to the missing one, with its signature when it could be read."""

    name: str
    signature: UntrustedStr | None = None


class SymbolResult(BaseModel):
    kind: Literal["symbol"] = "symbol"
    ecosystem: Ecosystem
    package: str
    symbol: str
    package_exists: Tristate
    resolved_version: str | None = None
    exists: Tristate
    symbol_kind: str | None = None  # function | class | method | attribute | type | module | …
    signature: UntrustedStr | None = None
    overloads: list[UntrustedStr] = Field(default_factory=list)
    defined_in: str | None = None
    did_you_mean: list[str] = Field(default_factory=list)
    suggestions: list[SymbolSuggestion] = Field(default_factory=list)  # did_you_mean with signatures
    evidence_source: str | None = None  # pyi | py-ast | d.ts | rustdoc | pkgsite | typeshed
    pending: bool = False
    retry_after_ms: int | None = None
    reason: str | None = None


class CheckLanguage(StrEnum):
    python = "python"
    typescript = "typescript"
    javascript = "javascript"
    go = "go"
    rust = "rust"


class CheckRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "language": "python",
                    "code": 'import reqeusts\n\nresponse = reqeusts.get("https://example.com", timeout=5)\n',
                }
            ]
        }
    )

    language: CheckLanguage
    code: str = Field(min_length=1, max_length=MAX_CHECK_CODE_BYTES)
    # package → pinned version
    versions: dict[PackageName, VersionText] = Field(default_factory=dict, max_length=MAX_CHECK_PINS)


class DiagnosticVerdict(StrEnum):
    ok = "ok"
    nonexistent_package = "nonexistent_package"
    placeholder = "placeholder"
    likely_typo = "likely_typo"
    suspicious_new = "suspicious_new"
    nonexistent_symbol = "nonexistent_symbol"
    deprecated = "deprecated"
    unknown = "unknown"


class Diagnostic(BaseModel):
    kind: Literal["diagnostic"] = "diagnostic"
    line: int
    column: int
    end_line: int
    end_column: int
    text: UntrustedStr
    ref_kind: Literal["import", "call", "attribute"]
    package: str | None = None
    version: str | None = None
    target: str | None = None
    verdict: DiagnosticVerdict
    signature: UntrustedStr | None = None
    fix_hint: UntrustedStr | None = None
    did_you_mean: list[str] = Field(default_factory=list)
    suggestions: list[SymbolSuggestion] = Field(default_factory=list)  # for a missing symbol: real names + signatures
    reason: str | None = None
