import localFont from "next/font/local";
import { Shippori_Mincho_B1 } from "next/font/google";

/** The brand faces, as the CSS variables tokens/theme.css expects (same set and files as apps/web). */
const gabarito = localFont({
  src: "../../../packages/brand/assets/fonts/gabarito-latin.woff2",
  weight: "400 900",
  variable: "--font-gabarito",
  display: "swap",
});
const instrument = localFont({
  src: "../../../packages/brand/assets/fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-instrument",
  display: "swap",
});
const geistMono = localFont({
  src: "../../../packages/brand/assets/fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});
// Kanji index only (典 符 今): CJK is served in unicode-range slices, so nothing is preloaded.
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", preload: false });

export const fontVariables = [gabarito, instrument, geistMono, shippori].map((f) => f.variable).join(" ");
