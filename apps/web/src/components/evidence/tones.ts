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

/** A tinted pill in a verdict's colour: soft fill, a line, the tone as text (cdr-kit's status pills). */
export const TONE_PILL: Record<VerdictTone, string> = {
  verified: "border-verdict-verified/40 bg-verdict-verified/12 text-verdict-verified",
  mismatch: "border-verdict-mismatch/40 bg-verdict-mismatch/12 text-verdict-mismatch",
  "not-found": "border-verdict-not-found/40 bg-verdict-not-found/12 text-verdict-not-found",
  retracted: "border-verdict-retracted/40 bg-verdict-retracted/12 text-verdict-retracted",
  ambiguous: "border-verdict-ambiguous/40 bg-verdict-ambiguous/12 text-verdict-ambiguous",
  unknown: "border-verdict-unknown/40 bg-verdict-unknown/12 text-verdict-unknown",
};

/** A tinted note in a verdict's colour (retraction banners, partial answers). */
export const TONE_NOTE: Record<VerdictTone, string> = {
  verified: "border-l-verdict-verified bg-verdict-verified/[0.08]",
  mismatch: "border-l-verdict-mismatch bg-verdict-mismatch/[0.08]",
  "not-found": "border-l-verdict-not-found bg-verdict-not-found/[0.08]",
  retracted: "border-l-verdict-retracted bg-verdict-retracted/[0.08]",
  ambiguous: "border-l-verdict-ambiguous bg-verdict-ambiguous/[0.08]",
  unknown: "border-l-verdict-unknown bg-verdict-unknown/[0.08]",
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
  // source statuses
  rate_limited: "mismatch",
  unavailable: "not-found",
  skipped_budget: "unknown",
  not_applicable: "unknown",
};

export function toneOf(word: string | null | undefined): VerdictTone {
  return (word && WORD_TONE[word]) || "unknown";
}
