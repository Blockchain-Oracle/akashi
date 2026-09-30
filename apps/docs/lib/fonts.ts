import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader, Shippori_Mincho_B1 } from "next/font/google";

/** The brand faces, as the CSS variables tokens/theme.css expects (same set as apps/web). */
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });
// Kanji index only (典 符 今): CJK is served in unicode-range slices, so nothing is preloaded.
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", preload: false });

export const fontVariables = [newsreader, plexSans, plexMono, shippori].map((f) => f.variable).join(" ");
