"use client";

import type { CiteSchemas, CodeSchemas } from "@akashi/api-client";
import { AlertTriangle } from "lucide-react";

import { CitationCard } from "@/components/evidence/CitationCard";
import { NowCard } from "@/components/evidence/NowCard";
import { PackageCard } from "@/components/evidence/PackageCard";
import { SnippetCard } from "@/components/evidence/SnippetCard";
import { type RailSource, SourceRail } from "@/components/evidence/SourceRail";
import { VerdictStack } from "@/components/evidence/VerdictStack";

import type { DeskItem, DeskState } from "./useDesk";

interface Envelope {
  status: string;
  unavailable: string[];
  results: { kind: string; verdict?: string; status?: string }[];
  sources: RailSource[];
}
interface ErrorBody {
  error: { code: string; message: string; retryable?: boolean };
}

const envelope = (it: DeskItem) => (it.status === "done" ? (it.body as Envelope) : null);

function ItemError({ it }: { it: DeskItem }) {
  const err = (it.body as ErrorBody | undefined)?.error;
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-border bg-card p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-verdict-mismatch" aria-hidden />
      <div>
        <div className="font-mono text-xs text-muted-foreground">{err?.code ?? "unavailable"}</div>
        <p>{err?.message ?? "No answer for this item."}</p>
        <p className="mt-1 text-muted-foreground text-xs">{it.label}</p>
      </div>
    </div>
  );
}

function Card({ it, service, input }: { it: DeskItem; service: DeskState["service"]; input: string }) {
  if (it.status === "pending") return <div className="h-40 animate-pulse rounded-lg border border-border bg-card" />;
  const env = envelope(it);
  if (!env) return <ItemError it={it} />;
  if (service === "cite") {
    return <>{(env.results as unknown as CiteSchemas["CitationResult"][]).map((r) => <CitationCard key={r.index} result={r} input={it.label} />)}</>;
  }
  if (service === "code") {
    const first = env.results[0];
    if (first?.kind === "package") {
      return <>{(env.results as unknown as CodeSchemas["PackageResult"][]).map((r) => <PackageCard key={r.name} result={r} />)}</>;
    }
    return <SnippetCard code={input} diagnostics={env.results as unknown as CodeSchemas["Diagnostic"][]} />;
  }
  return <NowCard results={env.results} />;
}

/** The evidence: a summary, one card per item as it lands, and every source consulted beside them. */
export function Results({ state }: { state: DeskState }) {
  const envs = state.items.map(envelope).filter((e): e is Envelope => e !== null);
  const counts: Record<string, number> = {};
  if (state.service !== "now") {
    for (const e of envs) for (const r of e.results) if (r.verdict) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1;
  }
  const seen = new Set<string>();
  const sources = envs.flatMap((e) => e.sources).filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)));
  const unavailable = [...new Set(envs.flatMap((e) => e.unavailable))];
  return (
    <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        {Object.keys(counts).length > 0 && <VerdictStack counts={counts} elapsedMs={state.elapsedMs} />}
        {unavailable.length > 0 && (
          <p className="rounded-lg border border-verdict-mismatch/40 bg-verdict-mismatch/[0.06] px-4 py-2 text-sm">
            Partial answer: {unavailable.join(", ")} did not answer in time.
          </p>
        )}
        {state.items.map((it) => (
          <Card key={it.index} it={it} service={state.service} input={state.input} />
        ))}
      </div>
      <SourceRail sources={sources} />
    </div>
  );
}
