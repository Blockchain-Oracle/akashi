import { SERVICES, type ServiceKey } from "@akashi/brand";

import { cn } from "../cn";

interface Pipeline {
  input: string;
  deadlineS: number;
  // share of the hard stop each source typically takes (measured p50s, rounded), for the animation only
  sources: { name: string; share: number }[];
  decide: string;
}

const PIPELINES: Record<ServiceKey, Pipeline> = {
  cite: {
    input: "a citation",
    deadlineS: 8.5,
    sources: [
      { name: "Crossref", share: 0.12 },
      { name: "OpenAlex", share: 0.15 },
      { name: "DataCite", share: 0.1 },
      { name: "PubMed", share: 0.08 },
      { name: "Caselaw Access Project", share: 0.1 },
      { name: "The cited page + Wayback", share: 0.35 },
    ],
    decide: "match field by field · a retraction overrides",
  },
  code: {
    input: "a snippet or package",
    deadlineS: 7,
    sources: [
      { name: "npm", share: 0.08 },
      { name: "PyPI", share: 0.1 },
      { name: "crates.io · Go · Maven…", share: 0.12 },
      { name: "deps.dev", share: 0.15 },
      { name: "published type definitions", share: 0.3 },
    ],
    decide: "exists → placeholder → typo → too new",
  },
  now: {
    input: "a question about now",
    deadlineS: 4,
    sources: [
      { name: "central banks", share: 0.2 },
      { name: "MET Norway · NWS", share: 0.3 },
      { name: "Wikidata", share: 0.25 },
      { name: "IANA tz database", share: 0.05 },
      { name: "GDELT · Hacker News", share: 0.2 },
    ],
    decide: "compare the sources · judge each one's age",
  },
};

const FULL = 1;
const PCT = 100;
const BAR_STAGGER_S = 0.12;

/** One service's check: the input fans out to its sources in parallel, inside the hard stop, then a verdict. */
export function ServicePipeline({ service, className }: { service: ServiceKey; className?: string }) {
  const p = PIPELINES[service];
  return (
    <figure className={cn("not-prose rounded-3xl border border-border bg-card p-5 md:p-8", className)}>
      <div className="grid items-center gap-5 md:grid-cols-[auto_1fr_auto] md:gap-8">
        <div className="rounded-2xl border border-border bg-background px-4 py-3 text-center">
          <div className="font-mark text-2xl" aria-hidden>
            {SERVICES[service].kanji}
          </div>
          <div className="mt-1 text-muted-foreground text-xs">{p.input}</div>
        </div>
        <div>
          <div className="mb-2 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>asked in parallel</span>
            <span>hard stop {p.deadlineS} s</span>
          </div>
          <ul className="space-y-2">
            {p.sources.map(({ name, share }, i) => (
              <li key={name} className="grid grid-cols-[minmax(7rem,11rem)_1fr] items-center gap-3 text-xs">
                <span className="truncate text-muted-foreground">{name}</span>
                <span className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="sp-bar absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ "--sp-width": `${Math.min(share, FULL) * PCT}%`, "--sp-delay": `${i * BAR_STAGGER_S}s` } as React.CSSProperties}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/60 bg-primary/5 px-4 py-3 text-center">
          <div className="font-medium text-sm">verdict</div>
          <div className="mt-1 max-w-[12rem] text-muted-foreground text-xs">{p.decide}</div>
        </div>
      </div>
    </figure>
  );
}
