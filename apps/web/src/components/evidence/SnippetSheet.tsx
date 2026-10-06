import type { CodeSchemas } from "@akashi/api-client";
import { VerdictGlyph } from "@akashi/brand/react";

import { cn } from "@/lib/utils";

import { TONE_TEXT, toneOf } from "./tones";
import { VerdictStamp } from "./VerdictStamp";

type Diagnostic = CodeSchemas["Diagnostic"];

const LINE_TINT: Record<string, string> = {
  "not-found": "bg-verdict-not-found/[0.14]",
  retracted: "bg-verdict-retracted/[0.14]",
  mismatch: "bg-verdict-mismatch/[0.14]",
  ambiguous: "bg-verdict-ambiguous/[0.14]",
};

/**
 * A snippet on the console with each checked reference marked on its line (after 21st.dev Code Block 28281 / 28695:
 * line tint + gutter glyph), then one finding per reference on the card below it.
 */
export function SnippetSheet({ code, diagnostics }: { code: string; diagnostics: Diagnostic[] }) {
  const byLine = new Map<number, Diagnostic>();
  for (const d of diagnostics) {
    const prev = byLine.get(d.line);
    if (!prev || toneOf(prev.verdict) === "verified") byLine.set(d.line, d);
  }
  const lines = code.replace(/\n$/, "").split("\n");
  const problems = diagnostics.filter((d) => d.verdict !== "ok");
  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <VerdictStamp word={problems.length ? (problems[0]?.verdict ?? "unknown") : "ok"} size="lg" />
        <span className="label">
          {diagnostics.length} reference{diagnostics.length === 1 ? "" : "s"} checked · {problems.length} problem{problems.length === 1 ? "" : "s"}
        </span>
      </div>
      <pre className="console mx-4 mb-4 overflow-x-auto rounded-(--radius) py-3 font-mono text-[13px] leading-6" tabIndex={0}>
        {lines.map((text, i) => {
          const d = byLine.get(i + 1);
          const tone = d ? toneOf(d.verdict) : null;
          return (
            <div key={i} className={cn("grid grid-cols-[2.75rem_1.25rem_1fr] pr-4", tone && LINE_TINT[tone])}>
              <span className="pr-2 text-right text-muted-foreground select-none">{i + 1}</span>
              <span className="grid place-items-center">
                {tone && tone !== "verified" && <VerdictGlyph tone={tone} className={cn("size-3.5", TONE_TEXT[tone])} />}
              </span>
              <span className="whitespace-pre">{text || " "}</span>
            </div>
          );
        })}
      </pre>
      <ul className="divide-y divide-border border-t border-border">
        {diagnostics.map((d, i) => (
          <li key={`${d.line}-${d.column}-${i}`} className="grid gap-2 px-6 py-4 sm:grid-cols-[11rem_1fr]">
            <div>
              <VerdictStamp word={d.verdict} size="sm" />
              <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">line {d.line}</div>
            </div>
            <div className="min-w-0 text-[15px]">
              <div className="font-mono text-sm font-medium">
                {d.package}
                {d.version ? `@${d.version}` : ""}
                {d.target ? <span className="font-normal text-muted-foreground"> · {d.target}</span> : null}
              </div>
              {d.reason && <p className="mt-1 text-pretty text-muted-foreground">{d.reason}</p>}
              {d.signature && <code className="mt-1 block truncate font-mono text-xs">{d.signature}</code>}
              {(d.suggestions?.length ?? 0) > 0 && (
                <ul className="mt-2 space-y-0.5 font-mono text-xs">
                  {d.suggestions?.map((s) => (
                    <li key={s.name} className="truncate">
                      <span className="font-semibold text-link">{s.name}</span>
                      {s.signature && <span className="text-muted-foreground"> {s.signature}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {!d.suggestions?.length && (d.did_you_mean?.length ?? 0) > 0 && (
                <p className="mt-1 font-mono text-xs">
                  did you mean <span className="font-semibold text-link">{d.did_you_mean?.join(", ")}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
