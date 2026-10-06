import { explorerService, ONCHAIN } from "@akashi/ui/onchain";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { SERVICE_ORDER, SERVICES } from "@/lib/constants/services";
import { docsPage } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

/** The three Pocket services as cards: the kanji in a lemon tile, the name, what it checks, the on-chain ID and price. */
export function ServiceCards() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {SERVICE_ORDER.map((key) => {
        const svc = SERVICES[key];
        return (
          <li key={key} className="card card-hover flex flex-col p-6">
            <span className="grid size-12 place-items-center rounded-(--radius) bg-marker font-mark text-2xl leading-none text-marker-foreground" aria-hidden>
              {svc.kanji}
            </span>
            <h3 className="mt-5 font-display text-2xl leading-tight font-bold tracking-[-0.02em]">{svc.name}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-pretty text-muted-foreground">{svc.summary}</p>
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
              <a href={explorerService(svc.id)} className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground tabular-nums hover:text-link" rel="noreferrer" target="_blank">
                {svc.id} · {ONCHAIN.services[key].cupr.toLocaleString("en-US")} CU
                <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
              </a>
              <a href={docsPage(`services/${key}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                Docs <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
