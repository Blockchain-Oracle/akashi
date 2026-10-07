import { BRAND } from "@akashi/brand";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Suspense } from "react";

import { NetworkStatus } from "@/components/shell/NetworkStatus";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { Bubble } from "@/components/ui/bubble";
import { Desk } from "@/features/desk/Desk";
import { Story } from "@/features/story/Story";
import { AGENT_PATH, DESK_ANCHOR, docsPage } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

/** The status pill is re-checked once a minute. */
export const revalidate = 60;

/**
 * The hero (specs/ui-v3-httpie.md §4, D-037): HTTPie's type and colour, the second reference's centred prompt box.
 * The title in Anton, a pink speech-bubble tag carrying the second half of the brand question, and the desk itself
 * as the product window: the mockup is real and it types.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-6 text-center sm:px-8 md:pt-20" aria-labelledby="hero-title">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="pill pill-plain">
              <span className="font-mark text-sm leading-none" aria-hidden>
                {BRAND.kanji}
              </span>
              Pocket Network · Agentic Services
            </span>
            <Suspense fallback={<span className="pill pill-plain text-muted-foreground">checking the services…</span>}>
              <NetworkStatus />
            </Suspense>
          </div>

          <div className="relative mx-auto mt-8 inline-block">
            <h1 id="hero-title" className="title text-[4.75rem] sm:text-[6.5rem] md:text-[8.5rem] lg:text-[9.5rem]">
              Is this real?
            </h1>
            <Bubble
              tone="agent"
              tail="bl"
              as="span"
              className="mt-5 inline-block px-4 py-2 text-base font-semibold sm:text-lg lg:absolute lg:-top-9 lg:right-0 lg:mt-0 lg:translate-x-1/3 lg:-rotate-3 lg:whitespace-nowrap"
            >
              …and is it current?
            </Bubble>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            Akashi is the fact-checker AI agents call before they answer: citations, code and live facts, every verdict
            with its sources and its age. Paste anything into the window below. The records are read live.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={DESK_ANCHOR} className="btn btn-go">
              Try an exhibit <ArrowDown className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
            <a href={docsPage()} className="btn btn-ink">
              Read the docs
            </a>
            <a href={AGENT_PATH} className="btn btn-link">
              Talk to the agent <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
          </div>
        </section>

        <section id="desk" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-10 pb-20 sm:px-8 md:pt-12" aria-label="Evidence desk">
          <Desk />
        </section>

        <Story />
      </main>
      <SiteFooter />
    </>
  );
}
