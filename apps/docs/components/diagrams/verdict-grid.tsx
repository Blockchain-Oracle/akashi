import { type VerdictTone } from "@akashi/brand";

import { Verdict } from "@/components/landing/verdict";
import { cn } from "@/lib/cn";

type Row = [word: string, tone: VerdictTone, meaning: string];

const SETS: Record<string, Row[]> = {
  citation: [
    ["verified", "verified", "the record exists and every field matches"],
    ["mismatch", "mismatch", "it exists, but a field is wrong (year 2016 → 2015)"],
    ["not_found", "not-found", "no record matches after a complete search"],
    ["retracted", "retracted", "it exists and has been retracted"],
    ["ambiguous", "ambiguous", "two records fit equally well"],
    ["unverifiable", "unknown", "a source could not be asked; try again"],
  ],
  claim: [
    ["supported", "verified", "the source says it"],
    ["contradicted", "not-found", "the source says the opposite"],
    ["insufficient_evidence", "unknown", "the source says neither"],
    ["unverifiable", "unknown", "the source text could not be read"],
  ],
  package: [
    ["ok", "verified", "exists, nothing suspicious"],
    ["does_not_exist", "not-found", "not in the registry"],
    ["placeholder", "retracted", "registered to hold nothing"],
    ["likely_typo", "mismatch", "a near-miss of a popular package"],
    ["suspicious_new", "ambiguous", "brand new, almost no downloads"],
    ["deprecated · yanked", "mismatch", "withdrawn by its maintainer"],
    ["unknown", "unknown", "the registry did not answer in time"],
  ],
  agreement: [
    ["agree", "verified", "independent sources match"],
    ["minor_diff", "mismatch", "they differ a little"],
    ["conflict", "not-found", "they disagree; every value is listed"],
    ["single_source", "unknown", "only one source covers it"],
  ],
  freshness: [
    ["fresh", "verified", "the newest the source publishes"],
    ["lagging", "mismatch", "on schedule, but older than the others"],
    ["stale", "not-found", "later than its schedule allows"],
    ["unknown", "unknown", "no publication time to judge by"],
  ],
};

/** A verdict vocabulary: glyph + word + colour, and what each one means. */
export function VerdictGrid({ set, className }: { set: keyof typeof SETS; className?: string }) {
  return (
    <div className={cn("not-prose grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-2", className)}>
      {(SETS[set] ?? []).map(([word, tone, meaning]) => (
        <div key={word} className="bg-fd-card px-4 py-3">
          <Verdict tone={tone} word={word} />
          <p className="mt-1 text-fd-muted-foreground text-xs">{meaning}</p>
        </div>
      ))}
    </div>
  );
}
