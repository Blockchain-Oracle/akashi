import { BRAND } from "@akashi/brand";
import { ArrowDown } from "lucide-react";
import { Suspense } from "react";

import { NetworkStatus } from "@/components/shell/NetworkStatus";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { MarkerStroke } from "@/components/ui/marker-stroke";
import { Desk } from "@/features/desk/Desk";
import { Story } from "@/features/story/Story";
import { docsPage } from "@/lib/constants/site";
import { FACTS } from "@/lib/constants/story";
import { ICON_STROKE } from "@/lib/constants/ui";

/** The status pill is re-checked once a minute. */
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-8 md:pt-20 md:pb-12" aria-labelledby="hero-title">
          <div className="flex flex-wrap items-center gap-2.5">
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
          <h1
            id="hero-title"
            className="mt-7 max-w-4xl font-display text-[2.75rem] leading-[1.0] font-extrabold tracking-[-0.03em] text-balance sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Is this real, and is it{" "}
            <span className="key">
              current
              <MarkerStroke />
            </span>
            ?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
            Akashi is the fact-checker AI agents call before they answer: citations, code and live facts, every verdict
            with its sources and its age. Paste anything below — the records are read live.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#desk" className="btn btn-marker">
              Try an exhibit <ArrowDown className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
            </a>
            <a href={docsPage()} className="btn btn-ink">
              Read the docs
            </a>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted-foreground">
            {FACTS.map((f) => (
              <li key={f} className="inline-flex items-center gap-2">
                <span className="text-marker-2" aria-hidden>
                  ✦
                </span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section id="desk" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-20 sm:px-8" aria-label="Evidence desk">
          <Desk />
        </section>

        <Story />
      </main>
      <SiteFooter />
    </>
  );
}
