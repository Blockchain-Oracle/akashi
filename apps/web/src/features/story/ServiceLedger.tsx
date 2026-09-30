import { ONCHAIN, explorerService } from "@akashi/ui/onchain";
import { ArrowUpRight } from "lucide-react";

import { docsPage } from "@/lib/constants/site";
import { SERVICE_ORDER, SERVICES } from "@/lib/constants/services";

const ICON_STROKE = 1.5;

/** The three Pocket services as ledger rows: kanji, name, what it checks, service ID and its price in compute units. */
export function ServiceLedger() {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {SERVICE_ORDER.map((key) => {
        const svc = SERVICES[key];
        return (
          <li key={key} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 py-7 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="row-span-2 font-mark text-4xl leading-none md:row-span-1" aria-hidden>
              {svc.kanji}
            </span>
            <div>
              <a href={docsPage(`services/${key}`)} className="font-display text-2xl hover:text-primary">
                {svc.name}
              </a>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{svc.summary}</p>
            </div>
            <a
              href={explorerService(svc.id)}
              className="col-start-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary md:col-start-3"
            >
              {svc.id} · {ONCHAIN.services[key].cupr.toLocaleString("en-US")} CU / relay
              <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
