/** The Akashi 証 brand as data: names, the verdict vocabulary and its tokens (tokens/theme.css holds the values). */

export const BRAND = {
  name: "Akashi",
  wordmark: "AKASHI",
  kanji: "証",
  meaning: "proof",
  tagline: "証 akashi, proof. Answers are evidence, not advice.",
} as const;

/** The CSS variables each app sets from next/font (see tokens/theme.css). */
export const FONT_VARIABLES = {
  display: "--font-newsreader",
  sans: "--font-plex-sans",
  mono: "--font-plex-mono",
  mark: "--font-shippori",
} as const;

/** A verdict tone: one colour token, one glyph, always shown with its word. */
export type VerdictTone = "verified" | "mismatch" | "not-found" | "retracted" | "ambiguous" | "unknown";

/** Glyph names on the 24-unit grid (the SVGs arrive with the evidence kit). */
export type VerdictGlyph = "tick" | "split-diamond" | "empty-circle" | "struck-circle" | "fork" | "dashed-circle";

export interface ToneSpec {
  /** Tailwind colour name, e.g. `text-verdict-verified`. */
  color: `verdict-${VerdictTone}`;
  glyph: VerdictGlyph;
  kanji: string;
}

export const TONES: Record<VerdictTone, ToneSpec> = {
  verified: { color: "verdict-verified", glyph: "tick", kanji: "青磁" },
  mismatch: { color: "verdict-mismatch", glyph: "split-diamond", kanji: "琥珀" },
  "not-found": { color: "verdict-not-found", glyph: "empty-circle", kanji: "朱" },
  retracted: { color: "verdict-retracted", glyph: "struck-circle", kanji: "紅" },
  ambiguous: { color: "verdict-ambiguous", glyph: "fork", kanji: "藤" },
  unknown: { color: "verdict-unknown", glyph: "dashed-circle", kanji: "" },
};

/** live-facts agreement → tone (specs/web.md §2): agree = verified, minor_diff = mismatch, conflict = not_found. */
export const AGREEMENT_TONE = {
  agree: "verified",
  minor_diff: "mismatch",
  conflict: "not-found",
  single_source: "unknown",
} as const satisfies Record<string, VerdictTone>;

/** The three services: capability ID, internal prefix, kanji index, display name and one-line summary. */
export const SERVICES = {
  cite: {
    id: "citation-verify",
    prefix: "/cite",
    kanji: "典",
    name: "Citation Verifier",
    summary:
      "Checks that a citation is real and says what it is cited for: DOIs, arXiv, PubMed, case law and web pages, with retractions flagged.",
  },
  code: {
    id: "code-reality-check",
    prefix: "/code",
    kanji: "符",
    name: "Code Reality Check",
    summary:
      "Checks that the packages, versions and symbols in a snippet exist before anyone installs them, with typosquats and placeholders flagged.",
  },
  now: {
    id: "live-facts",
    prefix: "/now",
    kanji: "今",
    name: "Live Facts",
    summary:
      "Current facts with their sources compared and their age stated: time, holidays, exchange rates, weather, news, stocks, jobs and Wikidata.",
  },
} as const;

/** Display order everywhere (nav, ledgers, docs). */
export const SERVICE_ORDER = ["cite", "code", "now"] as const;

export type ServiceKey = keyof typeof SERVICES;
export { SEAL, WORDMARK } from "./marks.generated";
