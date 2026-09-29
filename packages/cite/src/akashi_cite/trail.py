"""Per-item record of which upstreams answered, so every result can cite its evidence."""

from dataclasses import dataclass, field

from akashi_core.contract.enums import SourceStatus
from akashi_core.contract.sources import SourceRef
from akashi_core.errors import UpstreamFailure
from akashi_core.fanout import FanOutResult
from akashi_core.http.registry import UpstreamSpec

NOT_FOUND = "not_found"


@dataclass(slots=True)
class Trail:
    sources: list[SourceRef] = field(default_factory=list)
    unavailable: list[str] = field(default_factory=list)

    def ok(self, spec: UpstreamSpec, status: SourceStatus = SourceStatus.ok) -> None:
        self.sources.append(
            SourceRef(name=spec.name, status=status, licence=spec.licence, attribution=spec.attribution)
        )

    def failed(self, spec: UpstreamSpec, kind: str) -> None:
        if kind == NOT_FOUND:
            self.ok(spec, SourceStatus.not_found)
            return
        self.sources.append(SourceRef(name=spec.name, status=SourceStatus.unavailable))
        self.unavailable.append(spec.name)

    def failure(self, spec: UpstreamSpec, exc: UpstreamFailure) -> None:
        self.failed(spec, exc.kind)

    def record(self, specs: dict[str, UpstreamSpec], result: FanOutResult) -> None:
        for name in result.ok:
            self.ok(specs[name])
        for name, kind in result.failed.items():
            self.failed(specs[name], kind)
