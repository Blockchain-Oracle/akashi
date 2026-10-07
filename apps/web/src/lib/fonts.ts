import localFont from "next/font/local";
import { Shippori_Mincho_B1 } from "next/font/google";

/**
 * The brand faces (tokens/theme.css v4), exposed as the CSS variables the tokens expect.
 * Anton (the title face: uppercase H1s and page titles only), Instrument Sans (everything else) and Geist Mono (data)
 * are self-hosted from packages/brand/assets/fonts (woff2, latin subset) so a build never depends on
 * fonts.gstatic.com. Shippori stays on Google: its CJK subsets are served as unicode-range slices, nothing preloaded.
 */
const anton = localFont({
  src: "../../../../packages/brand/assets/fonts/anton-latin.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});
const instrument = localFont({
  src: "../../../../packages/brand/assets/fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-instrument",
  display: "swap",
});
const geistMono = localFont({
  src: "../../../../packages/brand/assets/fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", display: "swap", preload: false });

export const fontVariables = [anton, instrument, geistMono, shippori].map((f) => f.variable).join(" ");
