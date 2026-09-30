import type { CodeSchemas } from "@akashi/api-client";
import { VerdictGlyph } from "@akashi/brand/react";

import { cn } from "@/lib/utils";

import { TONE_TEXT, toneOf } from "./tones";
import { VerdictSeal } from "./VerdictSeal";

type Diagnostic = CodeSchemas["Diagnostic"];

const LINE_TINT: Record<string, string> = {
  "not-found": "bg-verdict-not-found/[0.07]",
  retracted: "bg-verdict-retracted/[0.07]",
  mismatch: "bg-verdict-mismatch/[0.07]",
  ambiguous: "bg-verdict-ambiguous/[0.07]",
};

/** A snippet with each checked reference marked on its line, and one finding per reference below it. */
export function SnippetCard({ code, diagnostics }: { code: string; diagnostics: Diagnostic[] }) {
  const byLine = new Map<number, Diagnostic>();
  for (const d of diagnostics) {
    const prev = byLine.get(d.line);
    if (!prev || toneOf(prev.verdict) === "verified") byLine.set(d.line, d);
  }
  const lines = code.replace(/\n$/, "").split("\n");
  const problems = diagnostics.filter((d) => d.verdict !== "ok");
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-border border-b px-4 py-2 font-mono text-muted-foreground text-xs">
        <span>
          {diagnostics.length} references checked · {problems.length} problem{problems.length === 1 ? "" : "s"}
        </span>
      </div>
      <pre className="overflow-x-auto py-2 font-mono text-[13px] leading-6">
        {lines.map((text, i) => {
          const d = byLine.get(i + 1);
          const tone = d ? toneOf(d.verdict) : null;
          return (
            <div key={i} className={cn("grid grid-cols-[2.5rem_1.25rem_1fr] pr-4", tone && LINE_TINT[tone])}>
              <span className="select-none pr-2 text-right text-muted-foreground/60">{i + 1}</span>
              <span className="grid place-items-center">
                {tone && tone !== "verified" && <VerdictGlyph tone={tone} className={cn("size-3.5", TONE_TEXT[tone])} />}
              </span>
              <span className="whitespace-pre">{text || " "}</span>
            </div>
          );
        })}
      </pre>
      <ul className="divide-y divide-border border-border border-t">
        {diagnostics.map((d, i) => (
          <li key={`${d.line}-${d.column}-${i}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[12rem_1fr]">
            <div>
              <VerdictSeal word={d.verdict} size="sm" />
              <div className="mt-1 font-mono text-muted-foreground text-[11px]">line {d.line}</div>
            </div>
            <div className="min-w-0 text-sm">
              <div className="font-mono text-xs">
                {d.package}
                {d.version ? `@${d.version}` : ""}
                {d.target ? <span className="text-muted-foreground"> · {d.target}</span> : null}
              </div>
              {d.reason && <p className="mt-1 text-pretty text-muted-foreground">{d.reason}</p>}
              {d.signature && <code className="mt-1 block truncate font-mono text-xs">{d.signature}</code>}
              {(d.suggestions?.length ?? 0) > 0 && (
                <ul className="mt-2 space-y-0.5 font-mono text-xs">
                  {d.suggestions?.map((s) => (
                    <li key={s.name} className="truncate">
                      <span className="text-primary">{s.name}</span>
                      {s.signature && <span className="text-muted-foreground"> {s.signature}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {!d.suggestions?.length && (d.did_you_mean?.length ?? 0) > 0 && (
                <p className="mt-1 font-mono text-xs">
                  did you mean <span className="text-primary">{d.did_you_mean?.join(", ")}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
