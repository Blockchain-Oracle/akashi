import { SERVICES } from "@akashi/brand";
import { ONCHAIN } from "@akashi/ui/onchain";
import { ArrowRight, Check } from "lucide-react";

import { Blob } from "@/components/ui/blob";
import { Window } from "@akashi/ui/window";
import { SERVICE_TONE, TONE_TILE } from "@/lib/constants/services";
import { DESK_ANCHOR, docsPage } from "@/lib/constants/site";
import { type Showcase, SHOWCASES } from "@/lib/constants/story";
import { ICON_STROKE } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

/** One service, HTTPie's product-section grammar: copy on one side, a real request → response window over a blob. */
function ServiceSection({ show, flip }: { show: Showcase; flip: boolean }) {
  const svc = SERVICES[show.service];
  const tone = SERVICE_TONE[show.service];
  const rec = ONCHAIN.services[show.service];
  return (
    <section id={`service-${show.service}`} aria-labelledby={`service-${show.service}-title`} className="scroll-mt-20 py-14 md:py-20">
      <div className={cn("mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 md:grid-cols-2 md:gap-14", flip && "md:[&>*:first-child]:order-2")}>
        <div>
          <div className="flex items-center gap-3">
            <span className={cn("grid size-11 place-items-center rounded-(--radius) font-mark text-xl leading-none", TONE_TILE[tone])} aria-hidden>
              {svc.kanji}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {svc.id} · {rec.cupr.toLocaleString("en-US")} CU a relay
            </span>
          </div>
          <h2 id={`service-${show.service}-title`} className="mt-5 font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance md:text-5xl">
            {show.question}
          </h2>
          <p className="mt-4 max-w-md text-lg text-pretty text-muted-foreground">{svc.summary}</p>
          <ul className="mt-6 space-y-2.5">
            {show.facts.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", TONE_TILE[tone])}>
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-pretty">{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={docsPage(`services/${show.service}`)} className="btn btn-ink">
              Docs <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
            <a href={DESK_ANCHOR} className="btn btn-link">
              Try it on the desk
            </a>
          </div>
        </div>

        <div className="relative isolate">
          <Blob tone={tone} className={cn("-top-10 h-56 w-64 sm:h-72 sm:w-80", flip ? "-left-10" : "-right-10")} />
          <Window title={<span className="truncate">{svc.id} · request</span>} right="200 OK" className="text-left">
            <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-foreground" tabIndex={0}>
              <code>{show.request}</code>
            </pre>
            <div className="border-t border-border px-5 py-2 font-mono text-[11px] text-muted-foreground">response</div>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed text-go" tabIndex={0}>
              <code>{show.response}</code>
            </pre>
          </Window>
        </div>
      </div>
    </section>
  );
}

/** The three services as alternating product sections. */
export function ServiceSections() {
  return (
    <div id="services" className="scroll-mt-20">
      {SHOWCASES.map((show, i) => (
        <ServiceSection key={show.service} show={show} flip={i % 2 === 1} />
      ))}
    </div>
  );
}
