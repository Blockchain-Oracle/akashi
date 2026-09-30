import { VerdictGlyph } from "@akashi/brand/react";

import { cn } from "@/lib/utils";

import { TONE_FILL, TONE_TEXT, toneOf } from "./tones";

/**
 * The run at a glance: one bar split by verdict, with a legend in glyph + word + colour.
 * Adapted from 21st.dev eugeneshilow/verdict-stack (29478), re-tokenized to the brand verdicts.
 */
export function VerdictStack({ counts, elapsedMs }: { counts: Record<string, number>; elapsedMs?: number }) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  const total = entries.reduce((n, [, c]) => n + c, 0);
  if (!total) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={entries.map(([w, n]) => `${n} ${w}`).join(", ")}>
        {entries.map(([word, n]) => (
          <div key={word} className={TONE_FILL[toneOf(word)]} style={{ flexGrow: n }} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {entries.map(([word, n]) => {
          const tone = toneOf(word);
          return (
            <span key={word} className={cn("inline-flex items-center gap-1.5 font-mono text-xs", TONE_TEXT[tone])}>
              <VerdictGlyph tone={tone} className="size-3.5" />
              {n} {word.replaceAll("_", " ")}
            </span>
          );
        })}
        {elapsedMs !== undefined && <span className="ml-auto font-mono text-muted-foreground text-xs">{elapsedMs} ms</span>}
      </div>
    </div>
  );
}
