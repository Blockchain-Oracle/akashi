/** Reading a finished item's Akashi envelope: shared by the readout and the evidence sheets. */
import type { DeskItem } from "./useDesk";

export interface RailSource {
  name: string;
  status: string;
  latency_ms?: number | null;
  licence?: string | null;
  attribution?: string | null;
  cache?: string | null;
}

export interface Envelope {
  status: string;
  unavailable: string[];
  results: { kind: string; verdict?: string; status?: string }[];
  sources: RailSource[];
}

export interface ErrorBody {
  error: { code: string; message: string; retryable?: boolean };
}

export const envelopeOf = (it: DeskItem): Envelope | null => (it.status === "done" ? (it.body as Envelope) : null);

export const envelopes = (items: DeskItem[]): Envelope[] => items.map(envelopeOf).filter((e): e is Envelope => e !== null);

/** verdict word → how many results carry it (live-facts answers have no verdict word, so none). */
export function verdictCounts(items: DeskItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of envelopes(items)) for (const r of e.results) if (r.verdict) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1;
  return counts;
}

/** Every upstream the run touched, once each, in first-seen order. */
export function sourcesOf(items: DeskItem[]): RailSource[] {
  const seen = new Set<string>();
  return envelopes(items)
    .flatMap((e) => e.sources)
    .filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)));
}

export const unavailableOf = (items: DeskItem[]): string[] => [...new Set(envelopes(items).flatMap((e) => e.unavailable))];
