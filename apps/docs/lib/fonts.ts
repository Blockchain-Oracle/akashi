import { Gabarito, Geist_Mono, Instrument_Sans, Shippori_Mincho_B1 } from "next/font/google";

/** The brand faces, as the CSS variables tokens/theme.css expects (same set as apps/web). */
const gabarito = Gabarito({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-gabarito" });
const instrument = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-instrument" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-geist-mono" });
// Kanji index only (典 符 今): CJK is served in unicode-range slices, so nothing is preloaded.
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", preload: false });

export const fontVariables = [gabarito, instrument, geistMono, shippori].map((f) => f.variable).join(" ");
