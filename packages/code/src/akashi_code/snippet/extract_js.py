"""TypeScript/JavaScript: ES imports, require(), member chains, `new X()` / call-result instances."""

import tree_sitter as ts

from akashi_code.snippet.languages import Language, matches, parse
from akashi_code.snippet.model import Binding, Extracted, Ref, span_of, text_of

_IMPORTS = """
(import_statement (import_clause (identifier) @default) source: (string (string_fragment) @src)) @stmt
(import_statement (import_clause (namespace_import (identifier) @ns)) source: (string (string_fragment) @src)) @stmt
(import_statement (import_clause (named_imports (import_specifier name: (identifier) @name alias: (identifier)? @alias))) source: (string (string_fragment) @src)) @stmt
"""
_REQUIRE = """
(variable_declarator name: (identifier) @var value: (call_expression function: (identifier) @fn arguments: (arguments (string (string_fragment) @src)))) @stmt
"""
# Only `new X()` gives a known type; a call result (axios.create()) could be anything, so it is not inferred.
_INSTANCE = "(variable_declarator name: (identifier) @var value: (new_expression constructor: (_) @ctor)) @stmt"


def _chain(node: ts.Node) -> list[str] | None:
    parts: list[str] = []
    while node.type == "member_expression":
        prop = node.child_by_field_name("property")
        obj = node.child_by_field_name("object")
        if prop is None or obj is None:
            return None
        parts.append(text_of(prop))
        node = obj
    if node.type != "identifier":
        return None
    parts.append(text_of(node))
    return parts[::-1]


def extract(code: bytes, lang: Language) -> Extracted:
    tree = parse(lang, code)
    out = Extracted()
    for caps in matches(lang, tree, _IMPORTS):
        span, src = span_of(caps["stmt"][0]), text_of(caps["src"][0])
        if "default" in caps:
            out.bindings.append(Binding(text_of(caps["default"][0]), src, "default", span))
        elif "ns" in caps:
            out.bindings.append(Binding(text_of(caps["ns"][0]), src, None, span))
        else:
            name = text_of(caps["name"][0])
            alias = text_of(caps["alias"][0]) if caps.get("alias") else name
            out.bindings.append(Binding(alias, src, name, span))
    for caps in matches(lang, tree, _REQUIRE):
        if text_of(caps["fn"][0]) == "require":
            out.bindings.append(
                Binding(text_of(caps["var"][0]), text_of(caps["src"][0]), None, span_of(caps["stmt"][0]))
            )
    for caps in matches(lang, tree, _INSTANCE):
        chain = _chain(caps["ctor"][0])
        if chain and text_of(caps["var"][0]) not in {b.alias for b in out.bindings}:
            out.instances[text_of(caps["var"][0])] = (chain[0], chain[1:])

    def visit(node: ts.Node) -> None:
        if node.type == "member_expression" and (node.parent is None or node.parent.type != "member_expression"):
            chain = _chain(node)
            if chain and len(chain) > 1:
                is_call = node.parent is not None and node.parent.type == "call_expression"
                out.refs.append(Ref(chain[0], chain[1:], span_of(node), text_of(node), is_call))
        for child in node.children:
            visit(child)

    visit(tree.root_node)
    return out
