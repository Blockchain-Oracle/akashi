"use client";

import type { CiteSchemas, CodeSchemas } from "@akashi/api-client";

import { CitationSheet } from "@/components/evidence/CitationSheet";
import { NowSheet } from "@/components/evidence/NowSheet";
import { PackageSheet } from "@/components/evidence/PackageSheet";
import { SnippetSheet } from "@/components/evidence/SnippetSheet";
import { SourcesLedger } from "@/components/evidence/SourcesLedger";

import { type ErrorBody, envelopeOf, sourcesOf, unavailableOf } from "./envelope";
import type { DeskItem, DeskState } from "./useDesk";

function ItemError({ it }: { it: DeskItem }) {
  const err = (it.body as ErrorBody | undefined)?.error;
  return (
    <div role="alert" className="card border-l-4 border-l-verdict-not-found px-5 py-4 text-[15px]">
      <div className="label">{err?.code ?? "unavailable"}</div>
      <p className="mt-1">{err?.message ?? "No answer for this item."}</p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{it.label}</p>
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div className="card animate-pulse px-6 py-6" aria-busy>
      <div className="h-7 w-32 rounded-chip bg-band" />
      <div className="mt-5 h-6 w-3/4 rounded-(--radius-sm) bg-band" />
      <div className="mt-2 h-4 w-1/2 rounded-(--radius-sm) bg-band" />
      <p className="mt-5 font-mono text-[11px] text-muted-foreground">reading the records for {label}</p>
    </div>
  );
}

function Card({ it, service, input }: { it: DeskItem; service: DeskState["service"]; input: string }) {
  if (it.status === "pending") return <Pending label={it.label} />;
  const env = envelopeOf(it);
  if (!env) return <ItemError it={it} />;
  if (service === "cite") {
    return <>{(env.results as unknown as CiteSchemas["CitationResult"][]).map((r) => <CitationSheet key={r.index} result={r} input={it.label} />)}</>;
  }
  if (service === "code") {
    const first = env.results[0];
    if (first?.kind === "package") {
      return <>{(env.results as unknown as CodeSchemas["PackageResult"][]).map((r) => <PackageSheet key={r.name} result={r} />)}</>;
    }
    return <SnippetSheet code={input} diagnostics={env.results as unknown as CodeSchemas["Diagnostic"][]} />;
  }
  return <NowSheet results={env.results} />;
}

/** The evidence: one card per item as it lands, and every source consulted beside them. */
export function Results({ state }: { state: DeskState }) {
  const sources = sourcesOf(state.items);
  const unavailable = unavailableOf(state.items);
  return (
    <div className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        {unavailable.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 rounded-(--radius) bg-warn-soft px-4 py-2.5 text-sm">
            <span className="pill pill-warn px-2.5 py-0.5 text-[11px]">partial</span>
            {unavailable.join(", ")} did not answer in time.
          </p>
        )}
        {state.items.map((it) => (
          <Card key={it.index} it={it} service={state.service} input={state.input} />
        ))}
      </div>
      <SourcesLedger sources={sources} />
    </div>
  );
}
