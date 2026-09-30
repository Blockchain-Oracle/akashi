/** Every backend verdict word → one of the six brand tones (a verdict is always glyph + word + colour). */
import type { VerdictTone } from "@akashi/brand";

// Full class names: Tailwind only generates what it can read in source.
export const TONE_TEXT: Record<VerdictTone, string> = {
  verified: "text-verdict-verified",
  mismatch: "text-verdict-mismatch",
  "not-found": "text-verdict-not-found",
  retracted: "text-verdict-retracted",
  ambiguous: "text-verdict-ambiguous",
  unknown: "text-verdict-unknown",
};

export const TONE_FILL: Record<VerdictTone, string> = {
  verified: "bg-verdict-verified",
  mismatch: "bg-verdict-mismatch",
  "not-found": "bg-verdict-not-found",
  retracted: "bg-verdict-retracted",
  ambiguous: "bg-verdict-ambiguous",
  unknown: "bg-verdict-unknown",
};

export const TONE_RING: Record<VerdictTone, string> = {
  verified: "border-verdict-verified/35 bg-verdict-verified/[0.06]",
  mismatch: "border-verdict-mismatch/35 bg-verdict-mismatch/[0.06]",
  "not-found": "border-verdict-not-found/35 bg-verdict-not-found/[0.06]",
  retracted: "border-verdict-retracted/35 bg-verdict-retracted/[0.06]",
  ambiguous: "border-verdict-ambiguous/35 bg-verdict-ambiguous/[0.06]",
  unknown: "border-verdict-unknown/35 bg-verdict-unknown/[0.06]",
};

const WORD_TONE: Record<string, VerdictTone> = {
  // citations and claims
  verified: "verified",
  supported: "verified",
  mismatch: "mismatch",
  not_found: "not-found",
  contradicted: "not-found",
  retracted: "retracted",
  ambiguous: "ambiguous",
  unverifiable: "unknown",
  insufficient_evidence: "unknown",
  // packages and snippets
  ok: "verified",
  does_not_exist: "not-found",
  nonexistent_package: "not-found",
  nonexistent_symbol: "not-found",
  placeholder: "retracted",
  likely_typo: "mismatch",
  suspicious_new: "ambiguous",
  deprecated: "mismatch",
  yanked: "mismatch",
  unknown: "unknown",
  // live facts
  agree: "verified",
  minor_diff: "mismatch",
  conflict: "not-found",
  single_source: "unknown",
  fresh: "verified",
  lagging: "mismatch",
  stale: "not-found",
};

export function toneOf(word: string | null | undefined): VerdictTone {
  return (word && WORD_TONE[word]) || "unknown";
}
