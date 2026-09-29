"""Python symbol lookup: pick the wheel, split the dotted symbol, resolve."""

from akashi_code.registries.pypi import normalize
from akashi_code.symbols.base import SymbolAnswer
from akashi_code.symbols.python.lookup import Resolver
from akashi_code.symbols.python.source import ModuleSource, is_stdlib, stdlib
from akashi_code.symbols.python.wheel import open_wheel
from akashi_core.contract.enums import Tristate


def split_symbol(wheel: ModuleSource, package: str, symbol: str) -> tuple[str, list[str]]:
    """'requests.Session.mount' or 'Session.mount' → ('requests', ['Session', 'mount'])."""
    tokens = [t for t in symbol.strip().replace(":", ".").split(".") if t]
    default_root = normalize(package).replace("-", "_")
    root = default_root if default_root in wheel.roots else (wheel.roots[0] if wheel.roots else default_root)
    if tokens and tokens[0] in wheel.roots:
        root, tokens = tokens[0], tokens[1:]
    # Longest dotted prefix that is itself a module in this wheel (e.g. numpy.linalg.norm → module numpy.linalg).
    module = root
    while tokens and f"{module}.{tokens[0]}" in wheel.modules:
        module, tokens = f"{module}.{tokens[0]}", tokens[1:]
    return module, tokens


async def lookup(package: str, version: str | None, symbol: str) -> tuple[SymbolAnswer, str | None]:
    """(answer, resolved version). Raises UpstreamFailure(not_found) when the package/version does not exist."""
    if is_stdlib(package):
        source = stdlib()
        module, tokens = split_symbol(source, package, symbol)
        answer = await Resolver(source).resolve(module, tokens)
        answer.evidence_source = "typeshed"
        return answer, f"python{source.version}"
    wheel = await open_wheel(package, version)
    if wheel is None:
        return SymbolAnswer(Tristate.unknown, reason="no_wheel_published"), version
    module, tokens = split_symbol(wheel, package, symbol)
    answer = await Resolver(wheel).resolve(module, tokens)
    return answer, wheel.version
