"""Rust: `use` declarations and crate::path::item scoped identifiers."""

import tree_sitter as ts

from akashi_code.snippet.languages import Language, parse
from akashi_code.snippet.model import Binding, Extracted, Ref, span_of, text_of

LOCAL_ROOTS = frozenset({"crate", "self", "super", "std", "core", "alloc", "Self"})


def _path(node: ts.Node) -> list[str]:
    if node.type == "scoped_identifier":
        left, name = node.child_by_field_name("path"), node.child_by_field_name("name")
        return [*(_path(left) if left is not None else []), *([text_of(name)] if name is not None else [])]
    return [text_of(node)] if node.type in {"identifier", "type_identifier"} else []


def _use_tree(node: ts.Node, prefix: list[str], out: Extracted, span_node: ts.Node) -> None:
    if node.type in {"scoped_identifier", "identifier"}:
        full = [*prefix, *_path(node)]
        if full and full[0] not in LOCAL_ROOTS:
            out.bindings.append(Binding(full[-1], full[0], "::".join(full[1:]) or None, span_of(span_node)))
    elif node.type == "use_as_clause":
        path, alias = node.child_by_field_name("path"), node.child_by_field_name("alias")
        full = [*prefix, *(_path(path) if path is not None else [])]
        if full and alias is not None and full[0] not in LOCAL_ROOTS:
            out.bindings.append(Binding(text_of(alias), full[0], "::".join(full[1:]) or None, span_of(span_node)))
    elif node.type == "scoped_use_list":
        path, items = node.child_by_field_name("path"), node.child_by_field_name("list")
        base = [*prefix, *(_path(path) if path is not None else [])]
        for child in items.named_children if items is not None else []:
            _use_tree(child, base, out, span_node)
    elif node.type == "use_list":
        for child in node.named_children:
            _use_tree(child, prefix, out, span_node)


def extract(code: bytes) -> Extracted:
    tree = parse(Language.rust, code)
    out = Extracted()

    def visit(node: ts.Node) -> None:
        if node.type == "use_declaration" and (arg := node.child_by_field_name("argument")) is not None:
            _use_tree(arg, [], out, node)
            return
        if node.type == "scoped_identifier" and (node.parent is None or node.parent.type != "scoped_identifier"):
            path = _path(node)
            if len(path) > 1 and path[0] not in LOCAL_ROOTS:
                is_call = node.parent is not None and node.parent.type == "call_expression"
                out.refs.append(Ref(path[0], path[1:], span_of(node), text_of(node), is_call))
        for child in node.children:
            visit(child)

    visit(tree.root_node)
    return out
