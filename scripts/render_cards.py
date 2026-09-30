#!/usr/bin/env python3
"""Render cards/<id>/card.template.json → cards/<id>/card.json (the bytes published on-chain).

Usage:
  python3 scripts/render_cards.py --api-base https://api.<domain> --repo-url https://github.com/<owner>/akashi

Placeholders: {{API_BASE}}, {{REPO_URL}}, {{UPDATED}} (defaults to today, UTC). The output is re-serialised
with a fixed layout so `encode_card.py diff` stays byte-stable across renders with the same inputs.
Standard library only.
"""

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

CARDS_DIR = Path(__file__).resolve().parents[1] / "cards"
TEMPLATE_NAME = "card.template.json"
OUTPUT_NAME = "card.json"
TARGET_BYTES = 4 * 1024  # card-authoring.md: target under 4 KiB


def render(template: str, values: dict[str, str]) -> str:
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", value)
    if "{{" in template:
        raise SystemExit(f"unfilled placeholder in template: {template[template.index('{{') :][:40]}")
    return json.dumps(json.loads(template), indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--api-base", required=True, help="public API origin, no trailing slash")
    parser.add_argument("--repo-url", required=True)
    parser.add_argument("--updated", default=dt.datetime.now(dt.UTC).date().isoformat())
    args = parser.parse_args()
    values = {"API_BASE": args.api_base.rstrip("/"), "REPO_URL": args.repo_url.rstrip("/"), "UPDATED": args.updated}

    for template in sorted(CARDS_DIR.glob(f"*/{TEMPLATE_NAME}")):
        body = render(template.read_text(), values)
        out = template.with_name(OUTPUT_NAME)
        out.write_text(body)
        size = len(body.encode("utf-8"))
        flag = "" if size <= TARGET_BYTES else f"  (over the {TARGET_BYTES}-byte target)"
        print(f"{out.relative_to(CARDS_DIR.parent)}: {size} bytes{flag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
