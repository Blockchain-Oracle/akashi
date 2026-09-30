import { cn } from "@/lib/cn";

// Live `shared` params on Pocket Beta (2026-09-29): offsets in blocks from the session's end.
const BETA_BLOCK_S = 30; // measured over 200 blocks
const SECONDS_PER_MINUTE = 60;
const LABEL_MIN_BLOCKS = 3; // narrower phases are too small to label
const PHASES = [
  { label: "Session", blocks: 20, note: "relays served", tone: "bg-fd-primary" },
  { label: "Grace", blocks: 10, note: "late relays still count", tone: "bg-fd-primary/50" },
  { label: "Wait", blocks: 2, note: "", tone: "bg-fd-border" },
  { label: "Claim", blocks: 10, note: "RelayMiner submits the relay tree's root", tone: "bg-verdict-mismatch" },
  { label: "", blocks: 1, note: "", tone: "bg-fd-border" },
  { label: "Proof", blocks: 10, note: "a Merkle proof if asked", tone: "bg-verdict-ambiguous" },
] as const;

// Share of each settled relay (live tokenomics params).
const SPLIT = [
  { who: "Suppliers (Akashi's RelayMiner)", pct: 77.03, tone: "bg-fd-primary" },
  { who: "Validators", pct: 13.65, tone: "bg-fd-muted-foreground" },
  { who: "DAO", pct: 4.39, tone: "bg-verdict-ambiguous" },
  { who: "Burned", pct: 2.5, tone: "bg-fd-border" },
  { who: "Service owner (Akashi)", pct: 2.44, tone: "bg-verdict-verified" },
] as const;

const total = PHASES.reduce((n, p) => n + p.blocks, 0);

/** From a relay to settled POKT: the session timeline, then how the settlement is split. */
export function SessionTimeline({ className }: { className?: string }) {
  return (
    <figure className={cn("not-prose space-y-8 rounded-3xl border border-fd-border bg-fd-card p-5 md:p-8", className)}>
      <div>
        <div className="mb-3 font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">
          From first relay to settlement on Beta · {total} blocks ≈ {Math.round((total * BETA_BLOCK_S) / SECONDS_PER_MINUTE)} min
        </div>
        <div className="relative flex h-10 overflow-hidden rounded-xl">
          {PHASES.map((p, i) => (
            <div
              key={`${p.label}-${i}`}
              className={cn("flex items-center justify-center font-mono text-[10px] text-fd-primary-foreground", p.tone)}
              style={{ flexGrow: p.blocks }}
            >
              {p.blocks >= LABEL_MIN_BLOCKS ? p.label : ""}
            </div>
          ))}
          <span className="st-cursor absolute inset-y-0 w-0.5 bg-fd-foreground" aria-hidden />
        </div>
        <ul className="mt-3 grid gap-1 text-fd-muted-foreground text-xs sm:grid-cols-2">
          {PHASES.filter((p) => p.note).map((p) => (
            <li key={p.label}>
              <span className="font-medium text-fd-foreground">{p.label}</span> · {p.blocks} blocks · {p.note}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-3 font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">
          Each settled relay, split
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          {SPLIT.map((s) => (
            <div key={s.who} className={s.tone} style={{ flexGrow: s.pct }} />
          ))}
        </div>
        <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
          {SPLIT.map((s) => (
            <li key={s.who} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-sm", s.tone)} aria-hidden />
              <span className="text-fd-muted-foreground">{s.who}</span>
              <span className="ml-auto font-mono">{s.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
