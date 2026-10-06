import localFont from "next/font/local";
import { Shippori_Mincho_B1 } from "next/font/google";

/**
 * The four brand faces (tokens/theme.css v3), exposed as the CSS variables the tokens expect.
 * The three Latin faces are self-hosted from packages/brand/assets/fonts (variable woff2, latin subset) so a build
 * never depends on fonts.gstatic.com (the 2026-10-06 image build failed on a fetch timeout). Shippori stays on Google:
 * its CJK subsets are served as unicode-range slices and nothing is preloaded.
 */
const gabarito = localFont({
  src: "../../../../packages/brand/assets/fonts/gabarito-latin.woff2",
  weight: "400 900",
  variable: "--font-gabarito",
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

export const fontVariables = [gabarito, instrument, geistMono, shippori].map((f) => f.variable).join(" ");
