import { type VerdictTone } from "@akashi/brand";

import { cn } from "@/lib/cn";

import { Verdict } from "./verdict";

function Cell({
  className,
  eyebrow,
  title,
  body,
  children,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("ak-rise flex flex-col overflow-hidden rounded-3xl border border-fd-border bg-fd-card", className)}>
      <div className="p-6 md:p-7">
        <div className="font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">{eyebrow}</div>
        <h3 className="mt-2 font-display text-2xl">{title}</h3>
        <p className="mt-1.5 max-w-md text-fd-muted-foreground text-sm leading-relaxed">{body}</p>
      </div>
      {children ? <div className="mt-auto border-fd-border border-t bg-fd-secondary/50 px-6 py-5">{children}</div> : null}
    </div>
  );
}

// Real answers from the running services (2026-09-30).
const PACKAGES: { input: string; tone: VerdictTone; word: string; note: string }[] = [
  { input: "pip install reqeusts", tone: "not-found", word: "does_not_exist", note: "did you mean requests" },
  { input: "npm i left-padx", tone: "not-found", word: "does_not_exist", note: "did you mean left-pad" },
  { input: "npm i react-codeshift", tone: "retracted", word: "placeholder", note: "description says 'placeholder'" },
  { input: "axios.fetchJson('/api')", tone: "not-found", word: "nonexistent_symbol", note: "not in axios's type definitions" },
];

const FIXINGS = [
  { bank: "ECB", rate: "0.88067", date: "09-29", fresh: true },
  { bank: "Bank of Canada", rate: "0.88212", date: "09-29", fresh: true },
  { bank: "Bank of England", rate: "0.87986", date: "09-28", fresh: false },
  { bank: "FRED (weekly)", rate: "0.87719", date: "09-25", fresh: false },
];

export function Bento() {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Cell
        className="md:col-span-3"
        eyebrow="典 Citation Verifier"
        title="Real, or invented"
        body="DOIs, arXiv, PubMed, case law and web pages, matched field by field against the record. Retractions override everything."
      >
        <div className="space-y-1 font-mono text-xs">
          <div className="text-fd-muted-foreground">925 F.3d 1339 (11th Cir. 2019)</div>
          <Verdict tone="not-found" word="not_found · page_inside_other_case" />
          <div className="text-fd-muted-foreground">J.D. v. Azar spans 1291–1349 · Caselaw Access Project, CC0</div>
        </div>
      </Cell>
      <Cell
        className="md:col-span-3"
        eyebrow="符 Code Reality Check"
        title="Installable, or hallucinated"
        body="Every import and call in a snippet checked against eight registries and the packages' real type definitions."
      >
        <ul className="space-y-2">
          {PACKAGES.map((p) => (
            <li key={p.input} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 font-mono text-xs">
              <span className="text-fd-foreground">{p.input}</span>
              <span className="flex items-baseline gap-2">
                <Verdict tone={p.tone} word={p.word} />
                <span className="text-fd-muted-foreground">{p.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </Cell>
      <Cell
        className="md:col-span-2"
        eyebrow="今 Live Facts"
        title="Current, and compared"
        body="Each fact from independent sources, with its age judged against its source's own schedule."
      >
        <div className="font-mono text-xs">
          <div className="mb-2 flex items-baseline justify-between">
            <span>USD → EUR 0.88067</span>
            <Verdict tone="verified" word="agree · 0.26%" />
          </div>
          <ul className="space-y-1 text-fd-muted-foreground">
            {FIXINGS.map((f) => (
              <li key={f.bank} className="flex justify-between gap-3">
                <span>{f.bank}</span>
                <span>
                  {f.rate} · {f.date} · {f.fresh ? "fresh" : "lagging"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Cell>
      <Cell
        className="md:col-span-2"
        eyebrow="Honest when degraded"
        title="Partial, never a 5xx"
        body="A source that misses the deadline is named; the rest of the answer still arrives."
      >
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-fd-muted-foreground">{`"status": "partial",
"unavailable": ["twelvedata"],
"notes": ["no live quote (twelvedata
  rate_limited): this is the official
  close of 2026-09-29"]`}</pre>
      </Cell>
      <Cell
        className="md:col-span-2"
        eyebrow="Pay per call"
        title="No account, no key"
        body="The portal quotes a price; your wallet signs exactly that amount; the answer comes back."
      >
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-fd-muted-foreground">{`402 Payment Required
"network": "eip155:84532",
"amount":  "5000",   // $0.005
"asset":   "USDC"`}</pre>
      </Cell>
    </div>
  );
}
