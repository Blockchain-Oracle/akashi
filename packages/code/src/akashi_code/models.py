"""Request/response models for code-reality-check."""

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from akashi_code.constants import (
    MAX_PACKAGE_NAME_CHARS,
    MAX_PACKAGES_PER_REQUEST,
    MAX_VERSION_CHARS,
)
from akashi_core.contract.enums import Tristate
from akashi_core.contract.fields import UntrustedStr


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
    ecosystem: Ecosystem
    name: str = Field(min_length=1, max_length=MAX_PACKAGE_NAME_CHARS)
    version: str | None = Field(default=None, max_length=MAX_VERSION_CHARS)


class PackagesRequest(BaseModel):
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
