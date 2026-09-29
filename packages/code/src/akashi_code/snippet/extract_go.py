"""Go: import specs (with aliases) and pkg.Symbol selector expressions."""

import tree_sitter as ts

from akashi_code.snippet.languages import Language, matches, parse
from akashi_code.snippet.model import Binding, Extracted, Ref, span_of, text_of

_IMPORTS = "(import_spec name: (package_identifier)? @alias path: (interpreted_string_literal) @path) @stmt"


def extract(code: bytes) -> Extracted:
    tree = parse(Language.go, code)
    out = Extracted()
    for caps in matches(Language.go, tree, _IMPORTS):
        path = text_of(caps["path"][0]).strip('"')
        alias = text_of(caps["alias"][0]) if caps.get("alias") else path.rsplit("/", 1)[-1]
        out.bindings.append(Binding(alias, path, None, span_of(caps["stmt"][0])))

    def visit(node: ts.Node) -> None:
        if node.type == "selector_expression":
            operand, field = node.child_by_field_name("operand"), node.child_by_field_name("field")
            if operand is not None and field is not None and operand.type == "identifier":
                is_call = node.parent is not None and node.parent.type == "call_expression"
                out.refs.append(Ref(text_of(operand), [text_of(field)], span_of(node), text_of(node), is_call))
        for child in node.children:
            visit(child)

    visit(tree.root_node)
    return out
