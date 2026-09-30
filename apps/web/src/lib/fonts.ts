import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader, Shippori_Mincho_B1 } from "next/font/google";

/** The four brand faces (specs/web.md §2), exposed as the CSS variables tokens/theme.css expects. */
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
// Kanji index only (典 符 今 証): CJK is served in unicode-range slices, so nothing is preloaded.
const shippori = Shippori_Mincho_B1({ weight: "800", variable: "--font-shippori", display: "swap", preload: false });

export const fontVariables = [newsreader, plexSans, plexMono, shippori].map((f) => f.variable).join(" ");
