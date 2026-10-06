import { VerdictGlyph } from "@akashi/brand/react";

import type { RailSource } from "@/features/desk/envelope";
import { cn } from "@/lib/utils";

import { TONE_TEXT, toneOf } from "./tones";

/** Every upstream the answers touched, in a card: number, status glyph, name, licence, latency. */
export function SourcesLedger({ sources }: { sources: RailSource[] }) {
  if (!sources.length) return null;
  return (
    <aside aria-label="Sources" className="card self-start overflow-hidden min-[1100px]:sticky min-[1100px]:top-24">
      <div className="label flex items-baseline justify-between border-b border-border bg-band px-5 py-3">
        <span>Sources consulted</span>
        <span className="tabular-nums">{sources.length}</span>
      </div>
      <ol className="divide-y divide-border">
        {sources.map((s, i) => {
          const tone = toneOf(s.status === "ok" ? "verified" : s.status);
          return (
            <li key={`${s.name}-${i}`} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-2 px-5 py-3">
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <VerdictGlyph tone={tone} className={cn("size-3.5 shrink-0", TONE_TEXT[tone])} />
                  <span className="truncate">{s.attribution ?? s.name}</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {[s.status.replaceAll("_", " "), s.licence, s.cache === "hit" ? "cached" : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {s.latency_ms !== null && s.latency_ms !== undefined ? `${s.latency_ms} ms` : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
