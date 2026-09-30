import { ArrowUpRight } from "lucide-react";

import { NumberTicker } from "@/components/ui/number-ticker";
import { FAILURES } from "@/lib/constants/story";

const ICON_STROKE = 1.5;

/** Four sourced numbers: how often agents are confidently wrong about sources, code and live facts. */
export function Failures() {
  return (
    <ul className="grid gap-px overflow-hidden rounded-(--radius) border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {FAILURES.map((f) => (
        <li key={f.source} className="flex flex-col bg-background p-6">
          <p className="font-display text-4xl leading-none tracking-tight sm:text-5xl">
            {f.prefix}
            <NumberTicker value={f.value} decimals={f.decimals} />
            {f.suffix}
          </p>
          <p className="mt-4 text-sm text-foreground">{f.claim}</p>
          <p className="mt-auto pt-6 font-mono text-[11px] text-muted-foreground">
            {f.href ? (
              <a href={f.href} className="inline-flex items-center gap-0.5 hover:text-primary" rel="noreferrer" target="_blank">
                {f.source} <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
              </a>
            ) : (
              f.source
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
