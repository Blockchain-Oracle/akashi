import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { explorerService } from "@akashi/ui/onchain";
import { ArrowUpRight, BookOpen, Plug } from "lucide-react";

import { GithubMark } from "@/components/ui/github-mark";
import { Bubble } from "@/components/ui/bubble";
import { docsPage, REPO_URL } from "@/lib/constants/site";
import { BAND_LINES } from "@/lib/constants/story";
import { ICON_STROKE } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import { PriceReceipt } from "./PriceReceipt";

const ZIGZAG = ["self-start", "self-center", "self-end"] as const;

/**
 * HTTPie's blue community band: three white speech bubbles zigzagging down the left, the ways to call Akashi on the
 * right, and the receipt (what a check costs) printed on the counter.
 */
export function BlueBand() {
  return (
    <section id="price" aria-labelledby="price-title" className="band-net scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div className="flex flex-col gap-5">
          <h2 id="price-title" className="sr-only">
            Check first, then answer, for half a cent
          </h2>
          {BAND_LINES.map((line, i) => (
            <Bubble key={line} tone="white" tail={i % 2 === 0 ? "br" : "bl"} className={cn("w-fit px-6 py-3 font-display text-2xl font-bold tracking-[-0.02em] shadow-2 sm:text-3xl", ZIGZAG[i % ZIGZAG.length])}>
              {line}
            </Bubble>
          ))}
          <div className="mt-6">
            <h3 className="font-display text-xl font-bold tracking-[-0.02em]">Call it from your agent</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={REPO_URL} className="btn btn-ink" rel="noreferrer" target="_blank">
                <GithubMark className="size-4" /> Source on GitHub
              </a>
              <a href={docsPage("pocket/from-an-agent")} className="btn btn-white">
                <Plug className="size-4" strokeWidth={ICON_STROKE} aria-hidden /> MCP · curl · x402
              </a>
              <a href={docsPage()} className="btn btn-white">
                <BookOpen className="size-4" strokeWidth={ICON_STROKE} aria-hidden /> Read the docs
              </a>
            </div>
            <p className="mt-6 font-mono text-xs text-muted-foreground">Registered on Pocket Beta</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {SERVICE_ORDER.map((key) => (
                <li key={key}>
                  <a
                    href={explorerService(SERVICES[key].id)}
                    className="inline-flex items-center gap-1.5 rounded-chip border border-border-2 px-3 py-1 font-mono text-xs transition-colors duration-(--duration-fast) hover:bg-card hover:text-card-foreground"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="font-mark" aria-hidden>
                      {SERVICES[key].kanji}
                    </span>
                    {SERVICES[key].id}
                    <ArrowUpRight className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="md:justify-self-end">
          <PriceReceipt />
        </div>
      </div>
    </section>
  );
}
