"""Static index of one Python module: what it defines, re-exports and how its callables are declared."""

import ast
from dataclasses import dataclass, field

MAX_SIGNATURE_CHARS = 500
MAX_OVERLOADS = 5
OVERLOAD_DECORATORS = frozenset({"overload", "typing.overload", "typing_extensions.overload"})


@dataclass(slots=True)
class ImportRef:
    module: str  # absolute dotted module
    attr: str | None  # None → the name is the module itself


@dataclass(slots=True)
class ModuleIndex:
    module: str
    is_package: bool
    defs: dict[str, ast.AST] = field(default_factory=dict)
    overloads: dict[str, list[ast.FunctionDef | ast.AsyncFunctionDef]] = field(default_factory=dict)
    imports: dict[str, ImportRef] = field(default_factory=dict)
    star_modules: list[str] = field(default_factory=list)
    dunder_all: list[str] | None = None
    dynamic: bool = False  # module-level __getattr__: anything may exist

    def names(self) -> list[str]:
        return sorted({*self.defs, *self.imports} - {"__getattr__"})


def _flatten(body: list[ast.stmt]) -> list[ast.stmt]:
    """Top-level statements including those under `if TYPE_CHECKING:`, `if sys.version_info…` and try/except."""
    out: list[ast.stmt] = []
    for stmt in body:
        if isinstance(stmt, ast.If):
            out += _flatten(stmt.body) + _flatten(stmt.orelse)
        elif isinstance(stmt, ast.Try):
            out += _flatten(stmt.body) + _flatten(stmt.orelse) + _flatten(stmt.finalbody)
            for handler in stmt.handlers:
                out += _flatten(handler.body)
        else:
            out.append(stmt)
    return out


def _is_overload(fn: ast.FunctionDef | ast.AsyncFunctionDef) -> bool:
    return any(ast.unparse(d) in OVERLOAD_DECORATORS for d in fn.decorator_list)


def _absolute(module: str, is_package: bool, level: int, target: str | None) -> str:
    if level == 0:
        return target or ""
    parts = module.split(".")
    base = parts if is_package else parts[:-1]
    base = base[: len(base) - (level - 1)] if level > 1 else base
    return ".".join([*base, target] if target else base)


def index_body(index: ModuleIndex, body: list[ast.stmt]) -> None:
    for stmt in _flatten(body):
        if isinstance(stmt, ast.FunctionDef | ast.AsyncFunctionDef):
            if _is_overload(stmt):
                index.overloads.setdefault(stmt.name, []).append(stmt)
            index.defs.setdefault(stmt.name, stmt)
            if stmt.name == "__getattr__":
                index.dynamic = True
        elif isinstance(stmt, ast.ClassDef):
            index.defs[stmt.name] = stmt
        elif isinstance(stmt, ast.Assign):
            for target in stmt.targets:
                if isinstance(target, ast.Name):
                    index.defs.setdefault(target.id, stmt)
                    if target.id == "__all__" and isinstance(stmt.value, ast.List | ast.Tuple):
                        index.dunder_all = [
                            e.value for e in stmt.value.elts if isinstance(e, ast.Constant) and isinstance(e.value, str)
                        ]
        elif isinstance(stmt, ast.AnnAssign | ast.TypeAlias) and isinstance(
            getattr(stmt, "target", None) or getattr(stmt, "name", None), ast.Name
        ):
            node = stmt.target if isinstance(stmt, ast.AnnAssign) else stmt.name
            index.defs.setdefault(node.id, stmt)  # type: ignore[union-attr]
        elif isinstance(stmt, ast.ImportFrom):
            source = _absolute(index.module, index.is_package, stmt.level, stmt.module)
            for alias in stmt.names:
                if alias.name == "*":
                    index.star_modules.append(source)
                else:
                    index.imports[alias.asname or alias.name] = ImportRef(source, alias.name)
        elif isinstance(stmt, ast.Import):
            for alias in stmt.names:
                bound = alias.asname or alias.name.split(".")[0]
                index.imports[bound] = ImportRef(alias.name if alias.asname else bound, None)


def build_index(module: str, is_package: bool, source: bytes) -> ModuleIndex:
    index = ModuleIndex(module=module, is_package=is_package)
    index_body(index, ast.parse(source).body)
    return index


def class_members(cls: ast.ClassDef) -> ModuleIndex:
    members = ModuleIndex(module=cls.name, is_package=False)
    index_body(members, cls.body)
    return members


def signature(name: str, node: ast.AST) -> tuple[str, str]:
    """(kind, human signature) for a definition node."""
    if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
        prefix = "async def" if isinstance(node, ast.AsyncFunctionDef) else "def"
        ret = f" -> {ast.unparse(node.returns)}" if node.returns else ""
        return "function", f"{prefix} {name}({ast.unparse(node.args)}){ret}"[:MAX_SIGNATURE_CHARS]
    if isinstance(node, ast.ClassDef):
        bases = ", ".join(ast.unparse(b) for b in node.bases)
        return "class", f"class {name}({bases})" if bases else f"class {name}"
    if isinstance(node, ast.AnnAssign):
        return "attribute", f"{name}: {ast.unparse(node.annotation)}"[:MAX_SIGNATURE_CHARS]
    if isinstance(node, ast.TypeAlias):
        return "type", f"type {name} = {ast.unparse(node.value)}"[:MAX_SIGNATURE_CHARS]
    return "attribute", name


def overload_signatures(name: str, fns: list[ast.FunctionDef | ast.AsyncFunctionDef]) -> list[str]:
    return [signature(name, fn)[1] for fn in fns[:MAX_OVERLOADS]]
