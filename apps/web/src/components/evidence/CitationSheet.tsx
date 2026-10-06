import type { CiteSchemas } from "@akashi/api-client";
import { ArrowUpRight } from "lucide-react";

import { ICON_STROKE } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import { TONE_NOTE } from "./tones";
import { VerdictStamp } from "./VerdictStamp";

type Citation = CiteSchemas["CitationResult"];

const MAX_AUTHORS = 3;
const PERCENT = 100;

function authors(list: string[] | null | undefined): string | null {
  if (!list?.length) return null;
  return list.length > MAX_AUTHORS ? `${list.slice(0, MAX_AUTHORS).join(", ")} et al.` : list.join(", ");
}

/**
 * One citation's evidence card: the verdict pill first, the record it matched as a titled entry, what differs as data
 * rows, why, and the records it might have been (after Parallel's find-all result).
 */
export function CitationSheet({ result, input }: { result: Citation; input: string }) {
  const m = result.matched;
  const diffs = result.field_diffs ?? [];
  const reasons = (result.reasons ?? []).filter((r) => r.includes(" ")); // sentences, not reason codes
  const candidates = result.candidates ?? [];
  const title = m?.title ?? input;
  const meta = [authors(m?.authors), m?.year, m?.venue].filter(Boolean).join(" · ");
  return (
    <article className="card px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerdictStamp word={result.verdict} size="lg" />
        <span className="label">
          {result.input_kind} · confidence {Math.round(result.confidence * PERCENT)}%
        </span>
      </div>

      <h3 className="mt-5 font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-pretty sm:text-[1.75rem]">{title}</h3>
      {meta && <p className="mt-2 text-[15px] text-muted-foreground">{meta}</p>}
      {m?.doi && (
        <a href={`https://doi.org/${m.doi}`} className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-medium text-link hover:underline" rel="noreferrer" target="_blank">
          doi:{m.doi} <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
        </a>
      )}

      {result.retraction && result.retraction.status !== "none" && (
        <div className={cn("mt-5 rounded-(--radius) border-l-4 px-4 py-2.5 text-[15px]", TONE_NOTE.retracted)}>
          <span className="font-semibold text-verdict-retracted">{result.retraction.status.replaceAll("_", " ")}</span>
          {result.retraction.date && <span className="text-muted-foreground"> on {result.retraction.date}</span>}
          {result.retraction.source && <span className="text-muted-foreground"> · {result.retraction.source}</span>}
        </div>
      )}

      {diffs.length > 0 && (
        <dl className="well mt-5 divide-y divide-border font-mono text-xs">
          {diffs.map((d) => (
            <div key={d.field} className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-2.5">
              <dt className="text-muted-foreground">{d.field}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-verdict-not-found line-through decoration-2">{String(d.given ?? "—")}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-verdict-verified">{String(d.found ?? "—")}</span>
                <span className="ml-auto text-muted-foreground">{d.severity}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {result.legal && (
        <p className="mt-5 font-mono text-xs text-muted-foreground">
          {result.legal.volume} {result.legal.reporter} {result.legal.page}
          {result.legal.case_name ? ` · ${result.legal.case_name}` : ""} · covered through {result.legal.covered_through}
          {result.legal.link && (
            <a href={result.legal.link} className="ml-2 inline-flex items-center gap-0.5 font-medium text-link hover:underline" rel="noreferrer" target="_blank">
              CourtListener <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
          )}
        </p>
      )}

      {reasons.length > 0 && (
        <ul className="mt-5 space-y-1.5 text-[15px] leading-relaxed">
          {reasons.map((r) => (
            <li key={r} className="text-pretty">
              {r}
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 && (
        <details className="group mt-5 text-sm">
          <summary className="cursor-pointer font-mono text-xs text-muted-foreground hover:text-foreground">
            {candidates.length} candidate{candidates.length === 1 ? "" : "s"} considered
          </summary>
          <ol className="well mt-2 divide-y divide-border">
            {candidates.map((c, i) => (
              <li key={c.doi ?? c.title} className="grid grid-cols-[1.25rem_1fr_auto] gap-2 px-4 py-2">
                <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 truncate">{c.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.year}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {result.retryable && <p className="mt-5 font-mono text-xs text-verdict-unknown">retryable · a source did not answer in time</p>}
    </article>
  );
}
