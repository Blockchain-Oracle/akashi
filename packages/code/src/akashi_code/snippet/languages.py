"""tree-sitter parsers per language (built once per process)."""

from enum import StrEnum
from functools import cache

import tree_sitter as ts
import tree_sitter_go
import tree_sitter_javascript
import tree_sitter_python
import tree_sitter_rust
import tree_sitter_typescript


class Language(StrEnum):
    python = "python"
    typescript = "typescript"
    javascript = "javascript"
    go = "go"
    rust = "rust"


_GRAMMARS = {
    Language.python: tree_sitter_python.language,
    Language.typescript: tree_sitter_typescript.language_tsx,  # TSX grammar also parses plain TS
    Language.javascript: tree_sitter_javascript.language,
    Language.go: tree_sitter_go.language,
    Language.rust: tree_sitter_rust.language,
}


@cache
def ts_language(lang: Language) -> ts.Language:
    return ts.Language(_GRAMMARS[lang]())


def parse(lang: Language, code: bytes) -> ts.Tree:
    return ts.Parser(ts_language(lang)).parse(code)


def query(lang: Language, source: str) -> ts.Query:
    return _query(lang, source)


@cache
def _query(lang: Language, source: str) -> ts.Query:
    return ts.Query(ts_language(lang), source)


def matches(lang: Language, tree: ts.Tree, source: str) -> list[dict[str, list[ts.Node]]]:
    return [caps for _, caps in ts.QueryCursor(query(lang, source)).matches(tree.root_node)]
