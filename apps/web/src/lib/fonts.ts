import { Gabarito, Geist_Mono, Instrument_Sans, Shippori_Mincho_B1 } from "next/font/google";

/** The four brand faces (tokens/theme.css v3), exposed as the CSS variables the tokens expect. */
const gabarito = Gabarito({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-gabarito", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-instrument", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-geist-mono", display: "swap" });
// Kanji index only (典 符 今 証): CJK is served in unicode-range slices, so nothing is preloaded.
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", display: "swap", preload: false });

export const fontVariables = [gabarito, instrument, geistMono, shippori].map((f) => f.variable).join(" ");
