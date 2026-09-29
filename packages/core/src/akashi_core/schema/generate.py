"""Build a 2020-12 outputSchema with `properties` (the portal only reports schemaCheck:"passed" then).

Rules (context/05-external-libs/json-schema-output-schemas.md): inline $defs; strip title, format, default,
example and additionalProperties:false; keep `required` minimal; results[] is anyOf one schema per `kind`.
"""

from typing import Any

from pydantic import BaseModel

from akashi_core.contract.envelope import Envelope, ErrorEnvelope

JSON_SCHEMA_DIALECT = "https://json-schema.org/draft/2020-12/schema"
_STRIP_KEYS = frozenset({"title", "format", "default", "example", "examples"})


def _inline(node: Any, defs: dict[str, Any]) -> Any:
    if isinstance(node, dict):
        if (ref := node.get("$ref")) and isinstance(ref, str) and ref.startswith("#/$defs/"):
            return _inline(defs[ref.removeprefix("#/$defs/")], defs)
        out: dict[str, Any] = {}
        for key, value in node.items():
            if key in _STRIP_KEYS or key == "$defs":
                continue
            if key == "additionalProperties" and value is False:
                continue
            out[key] = _inline(value, defs)
        return out
    if isinstance(node, list):
        return [_inline(v, defs) for v in node]
    return node


def model_schema(model: type[BaseModel]) -> dict[str, Any]:
    raw = model.model_json_schema(mode="serialization")
    return _inline(raw, raw.get("$defs", {}))


def output_schema(
    result_models: list[type[BaseModel]], example: dict[str, Any] | None = None
) -> dict[str, Any]:
    """One schema per service: the envelope with results[] = anyOf(result kinds), plus the error shape."""
    envelope = model_schema(Envelope[dict[str, Any]])
    envelope["properties"]["results"] = {
        "type": "array",
        "items": {"anyOf": [model_schema(m) for m in result_models]},
    }
    envelope["properties"]["error"] = model_schema(ErrorEnvelope)["properties"]["error"]
    schema: dict[str, Any] = {"$schema": JSON_SCHEMA_DIALECT, **envelope, "required": []}
    if example is not None:
        schema["examples"] = [example]
    return schema
