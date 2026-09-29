"""Pick the best wheel for a version and expose its modules (dotted name → archive member)."""

from dataclasses import dataclass, field
from typing import Any
from urllib.parse import quote

from akashi_code.constants import WHEEL_PLATFORM_PREFERENCE
from akashi_code.registries import clients
from akashi_code.registries.pypi import normalize
from akashi_code.symbols.python.zip_range import RemoteZip
from akashi_core.errors import UpstreamFailure

PY_SUFFIXES = (".pyi", ".py")  # stubs win over sources


@dataclass(slots=True)
class Wheel:
    version: str
    filename: str
    zip: RemoteZip
    modules: dict[str, str] = field(default_factory=dict)  # dotted → member path
    packages: set[str] = field(default_factory=set)  # dotted names that are packages (__init__)
    roots: list[str] = field(default_factory=list)  # top-level import names


def _rank(filename: str) -> int:
    for i, marker in enumerate(WHEEL_PLATFORM_PREFERENCE):
        if marker in filename:
            return i
    return len(WHEEL_PLATFORM_PREFERENCE)


async def release(name: str, version: str | None) -> dict[str, Any]:
    path = (
        f"/pypi/{quote(normalize(name), safe='')}/{quote(version, safe='')}/json"
        if version
        else f"/pypi/{quote(normalize(name), safe='')}/json"
    )
    data, _ = await clients.pypi().get_json(path)
    return data


def _map_modules(wheel: Wheel) -> None:
    for member in wheel.zip.members:
        if ".dist-info/" in member or ".data/" in member or not member.endswith(PY_SUFFIXES):
            continue
        stem = member.rsplit(".", 1)[0]
        parts = stem.split("/")
        if parts[-1] == "__init__":
            parts = parts[:-1]
            wheel.packages.add(".".join(parts))
        dotted = ".".join(parts)
        if dotted and (dotted not in wheel.modules or member.endswith(".pyi")):
            wheel.modules[dotted] = member
    wheel.roots = sorted({d.split(".")[0] for d in wheel.modules})


async def open_wheel(name: str, version: str | None) -> Wheel | None:
    """The wheel for `version` (latest when None), or None when only sdists exist."""
    data = await release(name, version)
    files = [u for u in data.get("urls", []) if u.get("packagetype") == "bdist_wheel"]
    if not files:
        return None
    best = min(files, key=lambda u: _rank(u["filename"]))
    zipfile = RemoteZip(clients.pypi_files(), best["url"], best["size"])
    try:
        await zipfile.open()
    except UpstreamFailure:
        raise
    wheel = Wheel(version=data["info"]["version"], filename=best["filename"], zip=zipfile)
    _map_modules(wheel)
    return wheel
