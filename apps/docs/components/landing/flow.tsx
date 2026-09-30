"use client";

// How a paid call reaches Akashi and comes back, drawn with the 21st.dev Animated Beam (dillionverma, id 919).
import { Seal } from "@akashi/brand/react";
import { Bot, Network, ReceiptText } from "lucide-react";
import { forwardRef, useRef } from "react";

import { AnimatedBeam } from "./animated-beam";

const ICON_STROKE = 1.5;
const BEAM_DURATION_S = 4;
const BEAM_STAGGER_S = 0.6;
const RETURN_CURVE_PX = -80;
const RETURN_DURATION_S = 5;
const RETURN_DELAY_S = 2;

const Node = forwardRef<HTMLDivElement, { label: string; sub: string; children: React.ReactNode }>(function Node(
  { label, sub, children },
  ref,
) {
  return (
    <div className="z-10 flex flex-col items-center gap-2 text-center">
      <div
        ref={ref}
        className="flex size-16 items-center justify-center rounded-2xl border border-fd-border bg-fd-card text-fd-foreground md:size-[4.5rem]"
      >
        {children}
      </div>
      <div className="font-medium text-xs md:text-sm">{label}</div>
      <div className="-mt-1.5 max-w-[8rem] text-[11px] text-fd-muted-foreground md:text-xs">{sub}</div>
    </div>
  );
});

export function Flow() {
  const box = useRef<HTMLDivElement>(null);
  const agent = useRef<HTMLDivElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const relay = useRef<HTMLDivElement>(null);
  const akashi = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="relative flex w-full items-start justify-between gap-2 px-1 py-10 text-fd-foreground">
      <Node ref={agent} label="Your agent" sub="asks, pays per call">
        <Bot className="size-7" strokeWidth={ICON_STROKE} />
      </Node>
      <Node ref={portal} label="Pocket portal" sub="402 · $0.005 in USDC">
        <ReceiptText className="size-7" strokeWidth={ICON_STROKE} />
      </Node>
      <Node ref={relay} label="Pocket Network" sub="relays to a staked supplier">
        <Network className="size-7" strokeWidth={ICON_STROKE} />
      </Node>
      <Node ref={akashi} label="Akashi" sub="checks the records">
        <Seal className="size-9" label={null} />
      </Node>
      <AnimatedBeam containerRef={box} fromRef={agent} toRef={portal} duration={BEAM_DURATION_S} />
      <AnimatedBeam containerRef={box} fromRef={portal} toRef={relay} duration={BEAM_DURATION_S} delay={BEAM_STAGGER_S} />
      <AnimatedBeam containerRef={box} fromRef={relay} toRef={akashi} duration={BEAM_DURATION_S} delay={BEAM_STAGGER_S * 2} />
      <AnimatedBeam
        containerRef={box}
        fromRef={agent}
        toRef={akashi}
        curvature={RETURN_CURVE_PX}
        reverse
        duration={RETURN_DURATION_S}
        delay={RETURN_DELAY_S}
        gradientStartColor="var(--verdict-verified)"
        gradientStopColor="var(--primary)"
      />
    </div>
  );
}
