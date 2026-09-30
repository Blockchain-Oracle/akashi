import { type VerdictTone } from "@akashi/brand";

import { Verdict } from "./verdict";

// One real batch sent to the running Citation Verifier on 2026-09-30: complete in 425 ms.
const ROWS: { citation: string; tone: VerdictTone; word: string; why: string }[] = [
  {
    citation: "Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019)",
    tone: "not-found",
    word: "not_found",
    why: "page 1339 falls inside J.D. v. Azar (925 F.3d 1291–1349); no case starts there",
  },
  {
    citation: "10.1016/S0140-6736(97)11096-0",
    tone: "retracted",
    word: "retracted",
    why: "Ileal-lymphoid-nodular hyperplasia… (Wakefield et al., The Lancet 1998) · retracted 2010-02-06",
  },
  {
    citation: "LeCun, Y., Bengio, Y. & Hinton, G. Deep learning. Nature 521, 436–444 (2016).",
    tone: "mismatch",
    word: "mismatch",
    why: "year 2016 → 2015 · 10.1038/nature14539",
  },
  {
    citation: "arXiv:1706.03762",
    tone: "verified",
    word: "verified",
    why: "Attention Is All You Need · Vaswani et al. 2017",
  },
];

/** The hero's product panel: one real batch request and the evidence that came back. */
export function HeroEvidence() {
  return (
    <div className="text-left">
      <div className="flex items-center justify-between gap-4 border-fd-border border-b px-5 py-3 font-mono text-xs text-fd-muted-foreground">
        <span>
          POST /v1/verify <span className="hidden sm:inline">· citation-verify</span>
        </span>
        <span>200 · complete · 425 ms</span>
      </div>
      <ol className="divide-y divide-fd-border">
        {ROWS.map((row) => (
          <li key={row.citation} className="grid gap-2 px-5 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
            <Verdict tone={row.tone} word={row.word} className="sm:pt-0.5" />
            <div className="min-w-0">
              <p className="truncate font-display text-base text-fd-foreground md:text-lg">{row.citation}</p>
              <p className="mt-1 text-fd-muted-foreground text-sm">{row.why}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-fd-border border-t bg-fd-secondary/60 px-5 py-3 font-mono text-[11px] text-fd-muted-foreground">
        <span>sources: case.law (CC0) · crossref · datacite · doi.org · openalex</span>
        <span>as_of 2026-09-30</span>
        <span>$0.005 per call on Pocket Network</span>
      </div>
    </div>
  );
}
