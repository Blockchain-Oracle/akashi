import type { CiteSchemas } from "@akashi/api-client";
import { ArrowUpRight } from "lucide-react";

import { VerdictSeal } from "./VerdictSeal";

type Citation = CiteSchemas["CitationResult"];

const MAX_AUTHORS = 3;
const PERCENT = 100;

function authors(list: string[] | null | undefined): string | null {
  if (!list?.length) return null;
  return list.length > MAX_AUTHORS ? `${list.slice(0, MAX_AUTHORS).join(", ")} et al.` : list.join(", ");
}

/** One citation's evidence: the verdict, the record it matched, what differs, and why. */
export function CitationCard({ result, input }: { result: Citation; input: string }) {
  const m = result.matched;
  const diffs = result.field_diffs ?? [];
  const reasons = (result.reasons ?? []).filter((r) => r.includes(" ")); // sentences, not reason codes
  const candidates = result.candidates ?? [];
  const title = m?.title ?? input;
  const meta = [authors(m?.authors), m?.year, m?.venue].filter(Boolean).join(" · ");
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerdictSeal word={result.verdict} size="lg" />
        <span className="font-mono text-muted-foreground text-xs">
          {result.input_kind} · confidence {Math.round(result.confidence * PERCENT)}%
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl leading-snug">{title}</h3>
      {meta && <p className="mt-1 text-muted-foreground text-sm">{meta}</p>}
      {m?.doi && (
        <a href={`https://doi.org/${m.doi}`} className="mt-1 inline-flex items-center gap-1 font-mono text-primary text-xs">
          {m.doi} <ArrowUpRight className="size-3" aria-hidden />
        </a>
      )}

      {result.retraction && result.retraction.status !== "none" && (
        <div className="mt-4 rounded-md border border-verdict-retracted/40 bg-verdict-retracted/[0.06] px-3 py-2 text-sm">
          <span className="font-medium text-verdict-retracted">{result.retraction.status.replaceAll("_", " ")}</span>
          {result.retraction.date && <span className="text-muted-foreground"> on {result.retraction.date}</span>}
          {result.retraction.source && <span className="text-muted-foreground"> · {result.retraction.source}</span>}
        </div>
      )}

      {diffs.length > 0 && (
        <dl className="mt-4 divide-y divide-border border-border border-y font-mono text-xs">
          {diffs.map((d) => (
            <div key={d.field} className="grid grid-cols-[6rem_1fr] gap-3 py-2">
              <dt className="text-muted-foreground">{d.field}</dt>
              <dd>
                <span className="text-verdict-not-found line-through">{String(d.given ?? "—")}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="text-verdict-verified">{String(d.found ?? "—")}</span>
                <span className="ml-2 text-muted-foreground">{d.severity}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {result.legal && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          {result.legal.volume} {result.legal.reporter} {result.legal.page}
          {result.legal.case_name ? ` · ${result.legal.case_name}` : ""} · covered through {result.legal.covered_through}
          {result.legal.link && (
            <a href={result.legal.link} className="ml-2 inline-flex items-center gap-0.5 text-primary">
              CourtListener <ArrowUpRight className="size-3" aria-hidden />
            </a>
          )}
        </p>
      )}

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {reasons.map((r) => (
            <li key={r} className="text-pretty">
              {r}
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground">{candidates.length} candidates</summary>
          <ul className="mt-2 space-y-1">
            {candidates.map((c) => (
              <li key={c.doi ?? c.title}>
                {c.title} <span className="text-muted-foreground">· {c.year}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {result.retryable && <p className="mt-4 font-mono text-verdict-unknown text-xs">retryable: a source did not answer in time</p>}
    </article>
  );
}
