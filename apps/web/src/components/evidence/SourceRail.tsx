import { VerdictGlyph } from "@akashi/brand/react";

import { cn } from "@/lib/utils";

import { TONE_TEXT } from "./tones";

export interface RailSource {
  name: string;
  status: string;
  latency_ms?: number | null;
  licence?: string | null;
  attribution?: string | null;
  cache?: string | null;
}

const STATUS_TONE = {
  ok: "verified",
  not_found: "not-found",
  rate_limited: "mismatch",
  unavailable: "not-found",
  skipped_budget: "unknown",
  not_applicable: "unknown",
} as const;

/** Every upstream the answers touched, numbered: status, speed, licence. */
export function SourceRail({ sources }: { sources: RailSource[] }) {
  if (!sources.length) return null;
  return (
    <aside aria-label="Sources" className="rounded-lg border border-border bg-card">
      <div className="border-border border-b px-4 py-3 font-mono text-muted-foreground text-xs uppercase tracking-widest">
        {sources.length} sources
      </div>
      <ol className="divide-y divide-border">
        {sources.map((s, i) => {
          const tone = STATUS_TONE[s.status as keyof typeof STATUS_TONE] ?? "unknown";
          return (
            <li key={`${s.name}-${i}`} className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-2 px-4 py-2.5">
              <span className="font-mono text-muted-foreground text-xs">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm">
                  <VerdictGlyph tone={tone} className={cn("size-3.5", TONE_TEXT[tone])} />
                  <span className="truncate">{s.attribution ?? s.name}</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-muted-foreground text-[11px]">
                  {[s.status.replaceAll("_", " "), s.licence, s.cache === "hit" ? "cached" : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="font-mono text-muted-foreground text-[11px] tabular-nums">
                {s.latency_ms !== null && s.latency_ms !== undefined ? `${s.latency_ms} ms` : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
