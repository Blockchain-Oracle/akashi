import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";

/** The brand faces the docs use, as the CSS variables tokens/theme.css expects (no kanji text in the docs chrome). */
const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const fontVariables = [newsreader, plexSans, plexMono].map((f) => f.variable).join(" ");
