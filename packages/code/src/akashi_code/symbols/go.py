"""Go symbols from the pkg.go.dev v1 API.

`filter` is a Go boolean expression (pkg.go.dev/api#filters), e.g. `name == "Context.AbortWithError"`, which
makes a single-symbol check one small request instead of paging all symbols.
"""

import json
from typing import Any
from urllib.parse import quote

from akashi_code.constants import PKGSITE_SIBLINGS_LIMIT
from akashi_code.registries import clients
from akashi_code.symbols.base import SymbolAnswer
from akashi_core.contract.enums import SourceStatus, Tristate
from akashi_core.errors import UpstreamFailure

_KIND = {
    "Function": "function",
    "Method": "method",
    "Type": "type",
    "Variable": "variable",
    "Constant": "const",
    "Field": "field",
}
_TOP_LEVEL_FILTER = 'contains(name, ".") == false'


def _go_string(value: str) -> str:
    """A Go string literal (JSON string escaping is a valid subset for identifiers)."""
    return json.dumps(value)


async def _symbols(package: str, version: str, expr: str, limit: int) -> tuple[list[dict[str, Any]], str]:
    params = f"version={quote(version, safe='')}&filter={quote(expr, safe='')}&limit={limit}"
    data, _ = await clients.pkgsite().get_json(f"/v1/symbols/{package}?{params}")
    return (data.get("symbols") or {}).get("items") or [], data.get("version", version)  # pkgsite sends null when empty


async def lookup(package: str, version: str | None, symbol: str) -> tuple[SymbolAnswer, str | None]:
    """Raises UpstreamFailure(not_found) when the package or version is unknown to pkg.go.dev."""
    wanted = symbol.strip()
    if wanted.startswith(package + "."):
        wanted = wanted[len(package) + 1 :]
    items, resolved = await _symbols(package, version or "latest", f"name == {_go_string(wanted)}", 1)
    if items:
        item = items[0]
        return SymbolAnswer(
            Tristate.yes,
            _KIND.get(item.get("kind", ""), item.get("kind")),
            item.get("synopsis"),
            defined_in=f"{package}.{item['name']}",
            evidence_source="pkgsite",
        ), resolved
    parent = wanted.split(".")[0]
    sibling_expr = f"hasPrefix(name, {_go_string(parent + '.')})" if "." in wanted else _TOP_LEVEL_FILTER
    try:
        siblings, _ = await _symbols(package, resolved, sibling_expr, PKGSITE_SIBLINGS_LIMIT)
    except UpstreamFailure as failure:
        if failure.kind != SourceStatus.not_found:
            raise
        siblings = []
    names = [s["name"].split(".")[-1] for s in siblings]
    suggest_for = None
    if "." in wanted and not siblings:
        # The parent type itself does not exist: suggest the type from top-level names instead.
        top, _ = await _symbols(package, resolved, _TOP_LEVEL_FILTER, PKGSITE_SIBLINGS_LIMIT)
        names, suggest_for = [s["name"] for s in top], parent
    answer = SymbolAnswer(
        Tristate.no, defined_in=package, siblings=names, evidence_source="pkgsite", suggest_for=suggest_for
    )
    return answer, resolved
