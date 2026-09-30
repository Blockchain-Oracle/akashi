"use client";

import { Seal } from "@akashi/brand/react";
import { Bot, Network, ReceiptText, Server } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

const STEP_MS = 1_700;
const ICON_STROKE = 1.5;

const NODES = [
  { title: "Agent", role: "asks", Icon: Bot },
  { title: "Agentic Portal", role: "quotes · takes payment", Icon: ReceiptText },
  { title: "Pocket gateway", role: "signs the relay", Icon: Network },
  { title: "RelayMiner", role: "Akashi's supplier", Icon: Server },
  { title: "Akashi", role: "checks the records", Icon: null },
] as const;

type Dir = "fwd" | "back";
// hop n joins node n and node n + 1
const STEPS: { hop: number; dir: Dir; text: string }[] = [
  { hop: 0, dir: "fwd", text: "The agent asks the portal" },
  { hop: 0, dir: "back", text: "402 · $0.005 in USDC" },
  { hop: 0, dir: "fwd", text: "It pays and asks again" },
  { hop: 1, dir: "fwd", text: "The portal hands the call to a gateway" },
  { hop: 2, dir: "fwd", text: "A relay to a supplier staked for the service" },
  { hop: 3, dir: "fwd", text: "Forwarded to Akashi as plain HTTP" },
  { hop: 3, dir: "back", text: "Verdict, sources and as_of" },
  { hop: 2, dir: "back", text: "The relay counts toward Akashi's claim" },
  { hop: 1, dir: "back", text: "The portal checks the output schema" },
  { hop: 0, dir: "back", text: "{ portal, data } back to the agent" },
];

/** How a paid call travels through Pocket Network to Akashi and back, one hop at a time. */
export function RequestPath({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduce]);

  const current = STEPS[step] ?? STEPS[0]!;
  return (
    <figure className={cn("not-prose rounded-3xl border border-fd-border bg-fd-card p-5 md:p-8", className)}>
      <div className="flex flex-col items-stretch md:flex-row md:items-center">
        {NODES.map((node, i) => {
          const active = !reduce && (i === current.hop || i === current.hop + 1);
          return (
            <div key={node.title} className="flex flex-col items-center md:flex-1 md:flex-row">
              <div
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-300 md:w-auto md:flex-col md:gap-2 md:px-3 md:py-4 md:text-center",
                  active ? "border-fd-primary bg-fd-primary/5" : "border-fd-border bg-fd-background",
                )}
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", active ? "text-fd-primary" : "text-fd-foreground")}>
                  {node.Icon ? <node.Icon className="size-6" strokeWidth={ICON_STROKE} /> : <Seal className="size-8" label={null} />}
                </span>
                <span>
                  <span className="block font-medium text-sm">{node.title}</span>
                  <span className="block text-fd-muted-foreground text-xs">{node.role}</span>
                </span>
              </div>
              {i < NODES.length - 1 && <Hop active={!reduce && current.hop === i} dir={current.dir} />}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-6 flex items-baseline gap-3 border-fd-border border-t pt-4 font-mono text-sm">
        {reduce ? (
          <ol className="list-decimal space-y-1 pl-5 text-fd-muted-foreground">
            {STEPS.map((s) => (
              <li key={s.text}>{s.text}</li>
            ))}
          </ol>
        ) : (
          <>
            <span className="text-fd-muted-foreground tabular-nums">
              {String(step + 1).padStart(2, "0")} / {STEPS.length}
            </span>
            <span key={step} className="rp-caption text-fd-foreground">
              {current.text}
            </span>
          </>
        )}
      </figcaption>
    </figure>
  );
}

function Hop({ active, dir }: { active: boolean; dir: Dir }) {
  return (
    <div className="relative h-8 w-px shrink-0 bg-fd-border md:h-px md:w-auto md:min-w-6 md:flex-1">
      {active && <span className={cn("rp-dot", dir === "fwd" ? "rp-dot-fwd bg-fd-primary" : "rp-dot-back bg-verdict-verified")} />}
    </div>
  );
}
