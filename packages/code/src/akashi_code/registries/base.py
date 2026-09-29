"""Normalized facts about one package as reported by its registry."""

from dataclasses import dataclass, field

from akashi_core.contract.enums import Tristate
from akashi_core.contract.sources import SourceRef


@dataclass(slots=True)
class PackageFacts:
    exists: Tristate
    latest: str | None = None
    version_exists: Tristate = Tristate.unknown
    description: str | None = None
    deprecated_reason: str | None = None
    yanked_reason: str | None = None
    yanked: bool = False
    first_published: str | None = None
    latest_published: str | None = None
    versions_count: int | None = None
    versions_tail: list[str] = field(default_factory=list)
    downloads_last_week: int | None = None
    unpacked_size: int | None = None
    file_count: int | None = None
    has_entrypoint: bool | None = None
    sources: list[SourceRef] = field(default_factory=list)
    unavailable: list[str] = field(default_factory=list)
