# Banner and demo cover

`../assets/banner-dark.svg`, `../assets/banner-light.svg` and `demo-cover.svg` are the sources. Each embeds its fonts (Outfit and JetBrains Mono) and the 証 seal's real paths from `apps/web/src/app/icon.svg`; every word is vector text. Re-render the PNGs from the repository root:

```sh
uv run --with fonttools --with brotli python .github/brand/render.py
```

It needs `rsvg-convert` (librsvg) and Fontconfig. Exports are 2×: banners at 2560 × 1280, the demo cover at 1672 × 941. 証 is set in Hiragino Mincho ProN (macOS); elsewhere install Noto Serif JP.
