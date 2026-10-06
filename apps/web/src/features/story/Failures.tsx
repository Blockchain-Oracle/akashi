import { ArrowUpRight } from "lucide-react";

import { NumberTicker } from "@/components/ui/number-ticker";
import { FAILURES } from "@/lib/constants/story";
import { ICON_STROKE } from "@/lib/constants/ui";

/** Four sourced numbers as stat cards: the figure, the claim it measures, the record it comes from. */
export function Failures() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {FAILURES.map((f) => (
        <li key={f.source} className="card flex flex-col p-6">
          <p className="font-display text-5xl leading-none font-bold tracking-[-0.03em] tabular-nums">
            {f.prefix}
            <NumberTicker value={f.value} decimals={f.decimals} />
            {f.suffix}
          </p>
          <p className="mt-4 text-[15px] leading-snug text-pretty">{f.claim}</p>
          <p className="mt-auto pt-5 font-mono text-[11px] text-muted-foreground">
            {f.href ? (
              <a href={f.href} className="inline-flex items-center gap-0.5 hover:text-link" rel="noreferrer" target="_blank">
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
