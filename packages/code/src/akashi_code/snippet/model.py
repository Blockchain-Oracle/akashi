"""What the extractors produce: import bindings and references (0-based rows/cols from tree-sitter)."""

from dataclasses import dataclass, field


@dataclass(slots=True)
class Span:
    line: int  # 1-based (CodeMirror-friendly)
    column: int  # 0-based
    end_line: int
    end_column: int


@dataclass(slots=True)
class Binding:
    """A local name introduced by an import: `alias` → (module spec, attribute or None for the module itself)."""

    alias: str
    spec: str
    attr: str | None
    span: Span


@dataclass(slots=True)
class Ref:
    """A use such as `requests.Session`, `s.mount` or `axios.fetchJson`: root identifier + member path."""

    root: str
    path: list[str]
    span: Span
    text: str
    is_call: bool = False


@dataclass(slots=True)
class Extracted:
    bindings: list[Binding] = field(default_factory=list)
    refs: list[Ref] = field(default_factory=list)
    instances: dict[str, tuple[str, list[str]]] = field(default_factory=dict)  # var → (root alias, path)


def span_of(node: object) -> Span:
    start, end = node.start_point, node.end_point  # type: ignore[attr-defined]
    return Span(start[0] + 1, start[1], end[0] + 1, end[1])


def text_of(node: object) -> str:
    return node.text.decode("utf-8", errors="replace")  # type: ignore[attr-defined]
