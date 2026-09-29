"""Where module source comes from: a wheel over HTTP ranges, or typeshed stubs on disk (stdlib)."""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import anyio
import typeshed_client

from akashi_code.constants import MAX_MODULES_PER_LOOKUP_LOCAL

STDLIB_TYPESHED_VERSION = (3, 13)


class ModuleSource(Protocol):
    module_budget: int
    modules: dict[str, str]  # dotted → member/path
    packages: set[str]
    roots: list[str]

    async def read(self, member: str) -> bytes: ...


@dataclass(slots=True)
class StdlibSource:
    """Python standard library, read from typeshed's .pyi stubs (bundled with typeshed-client)."""

    version: str = ".".join(map(str, STDLIB_TYPESHED_VERSION))
    module_budget: int = MAX_MODULES_PER_LOOKUP_LOCAL
    modules: dict[str, str] = field(default_factory=dict)
    packages: set[str] = field(default_factory=set)
    roots: list[str] = field(default_factory=list)

    @classmethod
    def load(cls) -> "StdlibSource":
        ctx = typeshed_client.get_search_context(version=STDLIB_TYPESHED_VERSION)
        src = cls()
        for module_path, path in typeshed_client.get_all_stub_files(ctx):
            dotted = str(module_path)  # typeshed yields dotted module names as str
            if dotted.split(".")[0] not in sys.stdlib_module_names:
                continue
            src.modules[dotted] = str(path)
            if Path(path).name == "__init__.pyi":
                src.packages.add(dotted)
        src.roots = sorted({d.split(".")[0] for d in src.modules})
        return src

    async def read(self, member: str) -> bytes:
        return await anyio.Path(member).read_bytes()


_stdlib: StdlibSource | None = None


def stdlib() -> StdlibSource:
    global _stdlib
    if _stdlib is None:
        _stdlib = StdlibSource.load()
    return _stdlib


def is_stdlib(package: str) -> bool:
    return package.split(".")[0] in sys.stdlib_module_names
