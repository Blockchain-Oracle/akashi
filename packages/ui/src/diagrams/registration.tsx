"use client";

import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal } from "@akashi/brand/react";
import { ArrowUpRight, Server, ShieldCheck } from "lucide-react";
import { useRef } from "react";

import { AnimatedBeam } from "../animated-beam";
import { cn } from "../cn";
import { explorerTx, ONCHAIN } from "../onchain";

const ICON_STROKE = 1.5;
const BEAM_DURATION_S = 4;
const BEAM_STAGGER_S = 0.5;

const SHORT_HEAD = 6;
const SHORT_TAIL = 4;
const short = (s: string) => `${s.slice(0, SHORT_HEAD)}…${s.slice(-SHORT_TAIL)}`;

/** Three service records → one supplier → the RelayMiner → the Akashi API. */
export function Registration({ className }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cite = useRef<HTMLDivElement>(null);
  const code = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLDivElement>(null);
  const recordRef = { cite, code, now };
  const supplier = useRef<HTMLDivElement>(null);
  const api = useRef<HTMLDivElement>(null);
  return (
    <figure className={cn("not-prose rounded-3xl border border-border bg-card p-5 md:p-8", className)}>
      <div ref={box} className="relative grid gap-6 md:grid-cols-[1.4fr_1fr_1fr] md:items-center md:gap-12">
        <div className="space-y-3">
          {SERVICE_ORDER.map((key) => {
            const svc = SERVICES[key];
            const rec = ONCHAIN.services[key];
            return (
              <div key={key} ref={recordRef[key]} className="relative z-10 rounded-2xl border border-border bg-background p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <code className="font-mono text-sm">{svc.id}</code>
                  <span className="font-mark text-lg leading-none" aria-hidden>
                    {svc.kanji}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                  <span>{rec.cupr.toLocaleString("en-US")} CU / relay</span>
                  <a href={explorerTx(rec.tx)} className="inline-flex items-center gap-0.5 hover:text-primary">
                    tx {short(rec.tx)} <ArrowUpRight className="size-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={supplier} className="relative z-10 rounded-2xl border border-primary bg-[color-mix(in_oklch,var(--primary)_6%,var(--card))] p-4 text-center">
          <ShieldCheck className="mx-auto size-7 text-primary" strokeWidth={ICON_STROKE} />
          <div className="mt-2 font-medium text-sm">One supplier stake</div>
          <div className="text-muted-foreground text-xs">serves all three IDs</div>
          <div className="mt-3 flex items-center justify-center gap-1.5 border-border border-t pt-3 text-xs">
            <Server className="size-4" strokeWidth={ICON_STROKE} /> RelayMiner
          </div>
        </div>
        <div ref={api} className="relative z-10 rounded-2xl border border-border bg-background p-4 text-center">
          <Seal className="mx-auto size-10" label={null} />
          <div className="mt-2 font-medium text-sm">Akashi API</div>
          <div className="font-mono text-muted-foreground text-xs">/cite · /code · /now</div>
        </div>
        <AnimatedBeam className="hidden md:block" containerRef={box} fromRef={cite} toRef={supplier} duration={BEAM_DURATION_S} />
        <AnimatedBeam className="hidden md:block" containerRef={box} fromRef={code} toRef={supplier} duration={BEAM_DURATION_S} delay={BEAM_STAGGER_S} />
        <AnimatedBeam className="hidden md:block" containerRef={box} fromRef={now} toRef={supplier} duration={BEAM_DURATION_S} delay={BEAM_STAGGER_S * 2} />
        <AnimatedBeam className="hidden md:block" containerRef={box} fromRef={supplier} toRef={api} duration={BEAM_DURATION_S} delay={BEAM_STAGGER_S * SERVICE_ORDER.length} />
      </div>
      <figcaption className="mt-5 border-border border-t pt-4 font-mono text-muted-foreground text-xs">
        owner {short(ONCHAIN.owner)} · Pocket Network Beta · heights {ONCHAIN.services.cite.height}–{ONCHAIN.services.now.height}
      </figcaption>
    </figure>
  );
}
