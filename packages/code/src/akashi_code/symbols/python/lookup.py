"""Resolve a dotted symbol inside one wheel by following definitions, re-exports and class bases.

Three-valued on purpose: anything we cannot see statically (compiled modules without stubs, module __getattr__,
bases from other packages) answers `unknown`, never `no`.
"""

import ast

from akashi_code.constants import CLASS_BASE_MAX_DEPTH, MAX_MODULES_PER_LOOKUP, REEXPORT_MAX_DEPTH
from akashi_code.symbols.base import SymbolAnswer
from akashi_code.symbols.python.astindex import (
    ModuleIndex,
    build_index,
    class_members,
    overload_signatures,
    signature,
)
from akashi_code.symbols.python.wheel import Wheel
from akashi_core.contract.enums import Tristate

REASON_MODULE_BUDGET = "module_budget_exceeded"
REASON_DYNAMIC = "module_getattr_dynamic"
REASON_EXTERNAL_BASE = "inherits_from_other_package"
REASON_COMPILED = "compiled_module_no_stubs"


class Resolver:
    def __init__(self, wheel: Wheel) -> None:
        self.wheel = wheel
        self._cache: dict[str, ModuleIndex | None] = {}

    async def module(self, dotted: str) -> ModuleIndex | None:
        if dotted in self._cache:
            return self._cache[dotted]
        member = self.wheel.modules.get(dotted)
        if member is None or len(self._cache) >= MAX_MODULES_PER_LOOKUP:
            self._cache[dotted] = None
            return None
        source = await self.wheel.zip.read(member)
        index = build_index(dotted, dotted in self.wheel.packages, source)
        self._cache[dotted] = index
        return index

    def _evidence(self, dotted: str) -> str:
        return "pyi" if self.wheel.modules.get(dotted, "").endswith(".pyi") else "py-ast"

    async def resolve(self, dotted: str, tokens: list[str], depth: int = 0) -> SymbolAnswer:
        if depth > REEXPORT_MAX_DEPTH:
            return SymbolAnswer(Tristate.unknown, reason="reexport_depth_exceeded")
        index = await self.module(dotted)
        if index is None:
            if len(self._cache) >= MAX_MODULES_PER_LOOKUP:
                return SymbolAnswer(Tristate.unknown, reason=REASON_MODULE_BUDGET)
            return SymbolAnswer(Tristate.unknown, reason=REASON_COMPILED)
        if not tokens:
            return SymbolAnswer(
                Tristate.yes, "module", f"module {dotted}", defined_in=dotted, evidence_source=self._evidence(dotted)
            )
        head, rest = tokens[0], tokens[1:]
        if (node := index.defs.get(head)) is not None:
            return await self._from_definition(index, head, node, rest, depth)
        if (ref := index.imports.get(head)) is not None:
            if ref.attr is None:
                return await self.resolve(ref.module, rest, depth + 1)
            submodule = f"{ref.module}.{ref.attr}"
            if submodule in self.wheel.modules:
                return await self.resolve(submodule, rest, depth + 1)
            if ref.module.split(".")[0] not in self.wheel.roots:
                return SymbolAnswer(Tristate.unknown, reason="reexported_from_other_package", defined_in=ref.module)
            return await self.resolve(ref.module, [ref.attr, *rest], depth + 1)
        if f"{dotted}.{head}" in self.wheel.modules:
            return await self.resolve(f"{dotted}.{head}", rest, depth + 1)
        for star in index.star_modules:
            found = await self.resolve(star, tokens, depth + 1)
            if found.exists is not Tristate.no:
                return found
        if index.dynamic:
            return SymbolAnswer(Tristate.unknown, reason=REASON_DYNAMIC, siblings=index.names())
        return SymbolAnswer(
            Tristate.no, defined_in=dotted, siblings=index.names(), evidence_source=self._evidence(dotted)
        )

    async def _from_definition(
        self, index: ModuleIndex, head: str, node: ast.AST, rest: list[str], depth: int
    ) -> SymbolAnswer:
        if not rest:
            kind, sig = signature(head, node)
            return SymbolAnswer(
                Tristate.yes,
                kind,
                sig,
                overload_signatures(head, index.overloads.get(head, [])),
                defined_in=f"{index.module}.{head}",
                evidence_source=self._evidence(index.module),
            )
        if isinstance(node, ast.ClassDef):
            return await self._member(index, node, rest, depth, CLASS_BASE_MAX_DEPTH)
        return SymbolAnswer(Tristate.unknown, reason="attribute_of_non_class", defined_in=f"{index.module}.{head}")

    async def _member(
        self, index: ModuleIndex, cls: ast.ClassDef, rest: list[str], depth: int, bases_left: int
    ) -> SymbolAnswer:
        members = class_members(cls)
        name, tail = rest[0], rest[1:]
        if (node := members.defs.get(name)) is not None:
            if tail:
                if isinstance(node, ast.ClassDef):
                    return await self._member(index, node, tail, depth, bases_left)
                return SymbolAnswer(Tristate.unknown, reason="attribute_of_non_class")
            kind, sig = signature(name, node)
            kind = "method" if kind == "function" else kind
            return SymbolAnswer(
                Tristate.yes,
                kind,
                sig,
                overload_signatures(name, members.overloads.get(name, [])),
                defined_in=f"{index.module}.{cls.name}.{name}",
                evidence_source=self._evidence(index.module),
            )
        unresolved_base = False
        for base in cls.bases:
            base_name = ast.unparse(base).split("[")[0]
            if base_name in {"object", "Generic", "Protocol", "typing.Generic", "typing.Protocol"}:
                continue
            if bases_left <= 0:
                unresolved_base = True
                continue
            located = await self._locate_class(index, base_name, depth)
            if located is None:
                unresolved_base = True
                continue
            owner, base_cls = located
            found = await self._member(owner, base_cls, rest, depth + 1, bases_left - 1)
            if found.exists is Tristate.yes:
                return found
            unresolved_base = unresolved_base or found.exists is Tristate.unknown
        if unresolved_base:
            return SymbolAnswer(Tristate.unknown, reason=REASON_EXTERNAL_BASE, siblings=members.names())
        return SymbolAnswer(
            Tristate.no,
            defined_in=f"{index.module}.{cls.name}",
            siblings=members.names(),
            evidence_source=self._evidence(index.module),
        )

    async def _locate_class(self, index: ModuleIndex, name: str, depth: int) -> tuple[ModuleIndex, ast.ClassDef] | None:
        head, _, attr = name.partition(".")
        if not attr and isinstance(node := index.defs.get(head), ast.ClassDef):
            return index, node
        ref = index.imports.get(head)
        if ref is None or depth > REEXPORT_MAX_DEPTH:
            return None
        module, cls_name = (ref.module, attr) if ref.attr is None else (ref.module, ref.attr)
        if ref.attr is not None and f"{ref.module}.{ref.attr}" in self.wheel.modules and attr:
            module, cls_name = f"{ref.module}.{ref.attr}", attr
        target = await self.module(module)
        if target is None:
            return None
        if isinstance(node := target.defs.get(cls_name), ast.ClassDef):
            return target, node
        if cls_name in target.imports:
            return await self._locate_class(target, cls_name, depth + 1)
        return None
