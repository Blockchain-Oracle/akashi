#!/usr/bin/env python3
"""Build cards/<id>/registry.json: the portal registry package PNF adds to services.json (deploy-runbook §7).

Usage:
  python3 scripts/build_registry.py --api-base https://api.<domain>

Inputs per service: registry.meta.json (prefix, displayName, category, description, example request),
input-schema.json, output-schema.json and openapi.json (for `methods`). The example response is captured
live from --api-base, so it is a real body, not a hand-written one. Standard library only.
"""

import argparse
import json
import sys
import urllib.request
from pathlib import Path

CARDS_DIR = Path(__file__).resolve().parents[1] / "cards"
PROTOCOLS = ["rest"]
METHOD_KIND = "read"  # every Akashi operation is a read: nothing is stored on the caller's behalf
HOUSE_STYLE_TAIL = "Pay per request in USDC; no account, no API key."
REQUEST_TIMEOUT_S = 30


def _post(url: str, body: dict) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), headers={"content-type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
        return json.load(resp)


def build(service_dir: Path, api_base: str) -> dict:
    meta = json.loads((service_dir / "registry.meta.json").read_text())
    if not meta["description"].endswith(HOUSE_STYLE_TAIL):
        raise SystemExit(f"{service_dir.name}: description must end with {HOUSE_STYLE_TAIL!r}")
    openapi = json.loads((service_dir / "openapi.json").read_text())
    methods = {f"{m.upper()} {path}": METHOD_KIND for path, ops in openapi["paths"].items() for m in ops}
    example = meta["example"]
    response = _post(f"{api_base}{meta['prefix']}{example['path']}", example["request"])
    return {
        "serviceId": service_dir.name,
        "displayName": meta["displayName"],
        "description": meta["description"],
        "category": meta["category"],
        "protocols": PROTOCOLS,
        "methods": methods,
        "inputSchema": json.loads((service_dir / "input-schema.json").read_text()),
        "outputSchema": json.loads((service_dir / "output-schema.json").read_text()),
        "example": {**example, "response": response},
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--api-base", required=True, help="public API origin, no trailing slash")
    args = parser.parse_args()
    for meta in sorted(CARDS_DIR.glob("*/registry.meta.json")):
        entry = build(meta.parent, args.api_base.rstrip("/"))
        out = meta.with_name("registry.json")
        out.write_text(json.dumps(entry, indent=2, ensure_ascii=False) + "\n")
        name = out.relative_to(CARDS_DIR.parent)
        print(f"{name}: {len(entry['methods'])} methods, example {entry['example']['path']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
