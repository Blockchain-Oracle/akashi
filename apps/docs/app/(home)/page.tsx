import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import Link from "next/link";

import { ClaimCheck } from "@akashi/ui/diagrams/claim-check";
import { PlainSteps } from "@akashi/ui/diagrams/plain-steps";
import { Registration } from "@akashi/ui/diagrams/registration";
import { RequestPath } from "@akashi/ui/diagrams/request-path";
import { Footer } from "@/components/landing/footer";
import { NetworkStatus } from "@/components/landing/network-status";
import { ONCHAIN } from "@akashi/ui/onchain";

export const revalidate = 60; // the live status pill

const PROMISE = {
  cite: "Real, retracted or invented",
  code: "Packages and symbols that exist",
  now: "Current facts, sources compared",
} as const;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-20 text-center md:pt-28">
        <NetworkStatus />
        <h1 className="mt-7 max-w-3xl text-balance font-display text-5xl leading-[1.02] tracking-[-0.02em] md:text-7xl">
          AI answers confidently. Akashi checks <em>first</em>.
        </h1>
        <p className="mt-5 max-w-xl text-balance text-fd-muted-foreground text-lg md:text-xl">
          A fact-checker AI agents call on Pocket Network before they answer.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="rounded-full bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground text-sm transition hover:opacity-90 active:scale-[0.97]"
          >
            What is Akashi?
          </Link>
          <Link
            href="/docs/pocket/how-a-call-flows"
            className="rounded-full border border-fd-border bg-fd-card px-6 py-3 font-medium text-sm transition hover:bg-fd-secondary active:scale-[0.97]"
          >
            How it runs on Pocket
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-14">
        <ClaimCheck />
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-20">
        <h2 className="font-display text-3xl md:text-4xl">How it works</h2>
        <PlainSteps className="mt-6" />
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-20">
        <h2 className="font-display text-3xl md:text-4xl">How it runs on Pocket</h2>
        <RequestPath className="mt-6" />
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pt-20">
        <h2 className="font-display text-3xl md:text-4xl">Three checks, three Pocket services</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SERVICE_ORDER.map((key) => (
            <Link
              key={key}
              href={`/docs/services/${key}`}
              className="group rounded-3xl border border-fd-border bg-fd-card p-6 transition hover:border-fd-primary"
            >
              <div className="font-mark text-3xl" aria-hidden>
                {SERVICES[key].kanji}
              </div>
              <div className="mt-4 font-display text-2xl">{SERVICES[key].name}</div>
              <p className="mt-1 text-fd-muted-foreground text-sm">{PROMISE[key]}</p>
              <div className="mt-5 flex justify-between font-mono text-fd-muted-foreground text-xs">
                <span>{SERVICES[key].id}</span>
                <span>{ONCHAIN.services[key].cupr.toLocaleString("en-US")} CU</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl">Registered on Pocket Beta</h2>
        <Registration className="mt-6" />
      </section>

      <Footer />
    </main>
  );
}
