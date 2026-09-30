import type { NowSchemas } from "@akashi/api-client";

import { VerdictSeal } from "./VerdictSeal";

type Provenance = NowSchemas["Provenance"];

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

export function age(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (seconds < SECONDS_PER_MINUTE) return `${seconds}s old`;
  if (seconds < SECONDS_PER_HOUR) return `${Math.round(seconds / SECONDS_PER_MINUTE)} min old`;
  if (seconds < SECONDS_PER_DAY) return `${Math.round(seconds / SECONDS_PER_HOUR)} h old`;
  return `${Math.round(seconds / SECONDS_PER_DAY)} d old`;
}

/** How current the answer is and whether its sources agree: two verdicts and the sources behind them. */
export function ProvenanceBar({ p }: { p: Provenance }) {
  const old = age(p.age_seconds);
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-border border-t pt-3">
      <VerdictSeal word={p.freshness} size="sm" />
      <VerdictSeal word={p.agreement} size="sm" />
      {p.spread_pct !== null && p.spread_pct !== undefined && (
        <span className="font-mono text-muted-foreground text-xs">spread {p.spread_pct}%</span>
      )}
      <span className="ml-auto font-mono text-muted-foreground text-xs">
        {(p.sources ?? []).join(" · ")}
        {old ? ` · ${old}` : ""}
      </span>
    </div>
  );
}
