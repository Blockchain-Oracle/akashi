"""Render rustdoc JSON `Type` values as readable Rust (format_version ≥ 39)."""

from typing import Any


def _args(args: dict[str, Any] | None) -> str:
    if not args or "angle_bracketed" not in args:
        return ""
    parts = []
    for arg in args["angle_bracketed"].get("args", []):
        if "type" in arg:
            parts.append(render(arg["type"]))
        elif "lifetime" in arg:
            parts.append(arg["lifetime"])
        elif "const" in arg:
            parts.append(str(arg["const"].get("expr", "_")))
    return f"<{', '.join(parts)}>" if parts else ""


def _bounds(bounds: list[dict[str, Any]]) -> str:
    out = []
    for b in bounds:
        if "trait_bound" in b:
            trait = b["trait_bound"]["trait"]
            out.append(f"{trait.get('path') or trait.get('name', '?')}{_args(trait.get('args'))}")
        elif "outlives" in b:
            out.append(b["outlives"])
    return " + ".join(out)


def render(ty: Any) -> str:
    if ty is None:
        return "()"
    if not isinstance(ty, dict):
        return str(ty)
    if "primitive" in ty:
        return ty["primitive"]
    if "generic" in ty:
        return ty["generic"]
    if "resolved_path" in ty:
        rp = ty["resolved_path"]
        return f"{rp.get('path') or rp.get('name', '?')}{_args(rp.get('args'))}"
    if "borrowed_ref" in ty:
        br = ty["borrowed_ref"]
        lifetime = f"{br['lifetime']} " if br.get("lifetime") else ""
        return f"&{lifetime}{'mut ' if br.get('is_mutable') else ''}{render(br['type'])}"
    if "tuple" in ty:
        return f"({', '.join(render(t) for t in ty['tuple'])})"
    if "slice" in ty:
        return f"[{render(ty['slice'])}]"
    if "array" in ty:
        return f"[{render(ty['array']['type'])}; {ty['array'].get('len', '_')}]"
    if "raw_pointer" in ty:
        rp = ty["raw_pointer"]
        return f"*{'mut' if rp.get('is_mutable') else 'const'} {render(rp['type'])}"
    if "impl_trait" in ty:
        return f"impl {_bounds(ty['impl_trait'])}"
    if "dyn_trait" in ty:
        traits = [
            f"{t['trait'].get('path') or t['trait'].get('name', '?')}{_args(t['trait'].get('args'))}"
            for t in ty["dyn_trait"].get("traits", [])
        ]
        return f"dyn {' + '.join(traits)}"
    if "qualified_path" in ty:
        qp = ty["qualified_path"]
        return f"<{render(qp.get('self_type'))}>::{qp.get('name', '?')}"
    return "_"


def generic_params(generics: dict[str, Any] | None) -> str:
    """`<T, E = Error, 'a>` from a rustdoc `generics` object (synthetic `impl Trait` params are skipped)."""
    parts = []
    for param in (generics or {}).get("params", []):
        kind = param.get("kind", {})
        if "lifetime" in kind:
            parts.append(param["name"])
        elif "type" in kind:
            if kind["type"].get("is_synthetic"):
                continue
            default = kind["type"].get("default")
            parts.append(f"{param['name']} = {render(default)}" if default else param["name"])
        elif "const" in kind:
            parts.append(f"const {param['name']}: {render(kind['const'].get('type'))}")
    return f"<{', '.join(parts)}>" if parts else ""


def render_fn(name: str, fn: dict[str, Any]) -> str:
    sig = fn.get("sig", {})
    params = []
    for pname, pty in sig.get("inputs", []):
        if pname == "self":
            rendered = render(pty)
            params.append(
                {"Self": "self", "&Self": "&self", "&mut Self": "&mut self"}.get(rendered, f"self: {rendered}")
            )
        else:
            params.append(f"{pname}: {render(pty)}")
    out = sig.get("output")
    header = fn.get("header", {})
    prefix = (
        ("const " if header.get("is_const") else "")
        + ("async " if header.get("is_async") else "")
        + ("unsafe " if header.get("is_unsafe") else "")
    )
    generics = generic_params(fn.get("generics"))
    return f"{prefix}fn {name}{generics}({', '.join(params)})" + (f" -> {render(out)}" if out is not None else "")
