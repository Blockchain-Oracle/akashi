"""Render the banner and demo-cover SVGs to PNG with librsvg, using the exact fonts embedded in the SVGs.

    uv run --with fonttools --with brotli python .github/brand/render.py

librsvg cannot read @font-face data URLs, so this extracts the embedded WOFF2 fonts, pins Outfit at weight 600 and
JetBrains Mono at 400, and registers them in a throwaway Fontconfig setup for the render. Nothing is installed.
"""

import base64
import io
import os
import re
import shutil
import struct
import subprocess
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
JOBS = [  # (source SVG, destination PNG, width, height): 2x exports
    (".github/assets/banner-dark.svg", ".github/assets/banner-dark.png", 2560, 1280),
    (".github/assets/banner-light.svg", ".github/assets/banner-light.png", 2560, 1280),
    (".github/brand/demo-cover.svg", "apps/web/public/demo/cover.png", 1672, 941),
]
WEIGHTS = {"Outfit": 600}  # every other embedded family renders at 400
DEFAULT_WEIGHT = 400
FONT_FACE = re.compile(r'@font-face\{font-family:"([^"]+)";.*?base64,([^)]*)\)')
SYSTEM_FONTS_CONF = [Path("/opt/homebrew/etc/fonts/fonts.conf"), Path("/etc/fonts/fonts.conf")]
PNG_SIZE_OFFSET = slice(16, 24)  # width and height in the IHDR chunk
# OpenType name ids: family, subfamily, full name, PostScript name, typographic family and subfamily
NAME_IDS = (1, 2, 4, 6, 16, 17)


def static_font(family: str, encoded: str) -> TTFont:
    font = TTFont(io.BytesIO(base64.b64decode(encoded)))
    weight = WEIGHTS.get(family, DEFAULT_WEIGHT)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
    style = "SemiBold" if weight > DEFAULT_WEIGHT else "Regular"
    names = (family, style, f"{family} {style}", f"{family.replace(' ', '')}-{style}", family, style)
    for name_id, value in zip(NAME_IDS, names, strict=True):
        for record in list(font["name"].names):
            if record.nameID == name_id:
                font["name"].setName(value, name_id, record.platformID, record.platEncID, record.langID)
    font.flavor = None
    return font


def fontconfig(work: Path, fonts: Path) -> dict[str, str]:
    system = next((p for p in SYSTEM_FONTS_CONF if p.exists()), None)
    include = f"<include>{escape(str(system))}</include>" if system else ""
    conf = work / "fonts.conf"
    conf.write_text(
        '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>'
        f"{include}<dir>{escape(str(fonts))}</dir><cachedir>{escape(str(work / 'cache'))}</cachedir></fontconfig>"
    )
    return dict(os.environ, FONTCONFIG_FILE=str(conf), XDG_CACHE_HOME=str(work / "cache"))


def main() -> None:
    if not shutil.which("rsvg-convert"):
        raise SystemExit("rsvg-convert is required: install librsvg first.")
    with tempfile.TemporaryDirectory(prefix=".render-") as temporary:
        work = Path(temporary)
        fonts = work / "fonts"
        fonts.mkdir()
        families = FONT_FACE.findall((ROOT / JOBS[0][0]).read_text())
        for family, encoded in families:
            static_font(family, encoded).save(fonts / f"{family.replace(' ', '-')}.ttf")
        env = fontconfig(work, fonts)
        for family, _ in families:
            matched = subprocess.check_output(["fc-match", "-f", "%{file}", family], env=env, text=True)
            if str(fonts) not in matched:
                raise RuntimeError(f"{family} resolved to a fallback font: {matched}")
        for source, destination, width, height in JOBS:
            subprocess.run(["rsvg-convert", "--width", str(width), "--height", str(height),
                            "--output", str(ROOT / destination), str(ROOT / source)], env=env, check=True)
            with (ROOT / destination).open("rb") as png:
                actual = struct.unpack(">II", png.read(24)[PNG_SIZE_OFFSET])
            if actual != (width, height):
                raise RuntimeError(f"{destination} is {actual}, expected {(width, height)}")
            print(f"{destination}: {width} x {height}")


if __name__ == "__main__":
    main()
