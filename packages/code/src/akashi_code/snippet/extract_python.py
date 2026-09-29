"""Python: import bindings, attribute chains, and one level of instance inference (s = mod.Class())."""

import tree_sitter as ts

from akashi_code.snippet.languages import Language, matches, parse
from akashi_code.snippet.model import Binding, Extracted, Ref, span_of, text_of

_IMPORTS = """
(import_statement name: (dotted_name) @mod) @stmt
(import_statement name: (aliased_import name: (dotted_name) @mod alias: (identifier) @alias)) @stmt
(import_from_statement module_name: (dotted_name) @from name: (dotted_name) @name) @stmt
(import_from_statement module_name: (dotted_name) @from name: (aliased_import name: (dotted_name) @name alias: (identifier) @alias)) @stmt
"""
_ASSIGN = "(assignment left: (identifier) @var right: (call function: (_) @fn)) @stmt"


def _chain(node: ts.Node) -> list[str] | None:
    """`a.b.c` → ['a', 'b', 'c'] when the chain is rooted at a plain identifier."""
    parts: list[str] = []
    while node.type == "attribute":
        attr = node.child_by_field_name("attribute")
        obj = node.child_by_field_name("object")
        if attr is None or obj is None:
            return None
        parts.append(text_of(attr))
        node = obj
    if node.type != "identifier":
        return None
    parts.append(text_of(node))
    return parts[::-1]


def extract(code: bytes) -> Extracted:
    tree = parse(Language.python, code)
    out = Extracted()
    for caps in matches(Language.python, tree, _IMPORTS):
        span = span_of(caps["stmt"][0])
        if "from" in caps:
            module, name = text_of(caps["from"][0]), text_of(caps["name"][0])
            alias = text_of(caps["alias"][0]) if "alias" in caps else name.split(".")[-1]
            out.bindings.append(Binding(alias, module, name, span))
        else:
            module = text_of(caps["mod"][0])
            alias = text_of(caps["alias"][0]) if "alias" in caps else module.split(".")[0]
            out.bindings.append(Binding(alias, module if "alias" in caps else alias, None, span))
    for caps in matches(Language.python, tree, _ASSIGN):
        chain = _chain(caps["fn"][0]) if caps["fn"][0].type == "attribute" else [text_of(caps["fn"][0])]
        if chain:
            out.instances[text_of(caps["var"][0])] = (chain[0], chain[1:])
    seen: set[tuple[int, int]] = set()

    def visit(node: ts.Node) -> None:
        if node.type == "attribute" and node.parent is not None and node.parent.type != "attribute":
            chain = _chain(node)
            if chain and len(chain) > 1:
                key = (node.start_byte, node.end_byte)
                if key not in seen:
                    seen.add(key)
                    is_call = node.parent.type == "call"
                    out.refs.append(Ref(chain[0], chain[1:], span_of(node), text_of(node), is_call))
        for child in node.children:
            visit(child)

    visit(tree.root_node)
    return out
