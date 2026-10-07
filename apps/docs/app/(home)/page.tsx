import { BRAND, SERVICE_ORDER, SERVICES, type ServiceKey } from "@akashi/brand";
import { ClaimCheck } from "@akashi/ui/diagrams/claim-check";
import { ONCHAIN } from "@akashi/ui/onchain";
import { Window } from "@akashi/ui/window";
import Link from "next/link";

import { Footer } from "@/components/landing/footer";
import { NetworkStatus } from "@/components/landing/network-status";
import { site } from "@/lib/site";

export const revalidate = 60; // the live status pill

const PROMISE: Record<ServiceKey, string> = {
  cite: "Real, retracted or invented",
  code: "Packages and symbols that exist",
  now: "Current facts, sources compared",
};

/** Each service's accent (D-034), as full class names so Tailwind can read them. */
const TILE: Record<ServiceKey, string> = {
  cite: "bg-agent text-agent-foreground",
  code: "bg-net-band text-net-band-foreground",
  now: "bg-go text-go-foreground",
};

/** Where to start: three columns of links under mono heads. */
const START: { title: string; links: { label: string; href: string; note?: string }[] }[] = [
  {
    title: "Start here",
    links: [
      { label: "What is Akashi?", href: "/docs", note: "plain words" },
      { label: "Words, explained", href: "/docs/glossary", note: "glossary" },
      { label: "For judges", href: "/docs/judges", note: "what to check" },
    ],
  },
  {
    title: "Akashi on Pocket",
    links: [
      { label: "How a call reaches Akashi", href: "/docs/pocket/how-a-call-flows", note: "the relay" },
      { label: "Paying for a call", href: "/docs/pocket/payment", note: "x402 · MPP" },
      { label: "Calling it from an agent", href: "/docs/pocket/from-an-agent", note: "MCP · curl" },
    ],
  },
  {
    title: "Types",
    links: [
      { label: "The response", href: "/docs/contract/response", note: "the envelope" },
      { label: "Errors and limits", href: "/docs/contract/errors", note: "4xx only" },
      { label: "API reference", href: "/docs/reference", note: "from the OpenAPI" },
    ],
  },
];

const EXAMPLE_CITATION = "Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019)";

/** The docs landing, in the HTTPie grammar: an Anton title, the trio of buttons, start-here cards, one terminal window. */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 pt-14 pb-12 text-center md:pt-20">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="pill pill-plain">
            <span className="font-mark text-sm leading-none" aria-hidden>
              {BRAND.kanji}
            </span>
            Documentation
          </span>
          <NetworkStatus />
        </div>
        <div className="relative mx-auto mt-8 inline-block">
          <h1 className="title text-6xl sm:text-7xl md:text-[7rem]">
            Check first.
            <br />
            Then answer.
          </h1>
          <span className="bubble bubble-agent bubble-tail-bl mt-5 inline-block px-4 py-2 text-base font-semibold lg:absolute lg:-top-8 lg:right-0 lg:mt-0 lg:translate-x-1/3 lg:-rotate-3 lg:whitespace-nowrap">
            docs for humans and agents
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-fd-muted-foreground md:text-xl">
          Three verification services an AI agent calls on Pocket Network before it cites a source, installs a package
          or states today&apos;s rate. Plain words first, types second.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/docs" className="btn btn-go">
            What is Akashi?
          </Link>
          <Link href="/docs/pocket/from-an-agent" className="btn btn-ink">
            Call it from an agent
          </Link>
          <Link href="/docs/reference" className="btn btn-white">
            API reference
          </Link>
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-14 md:grid-cols-3">
          {START.map((col) => (
            <div key={col.title} className="card p-6">
              <div className="label">{col.title}</div>
              <ul className="mt-3 divide-y divide-fd-border">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-baseline gap-3 py-2.5 text-[15px] font-medium">
                      <span className="group-hover:text-net">{l.label}</span>
                      <span className="leader" aria-hidden />
                      <span className="shrink-0 font-mono text-[11px] font-normal text-fd-muted-foreground">{l.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:py-24">
        <div>
          <p className="label">Quickstart · one call</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance md:text-5xl">One POST, one verdict.</h2>
          <p className="mt-4 max-w-md text-lg text-pretty text-fd-muted-foreground">
            Every response is a JSON object: a verdict word per input, the record it matched, every source asked and when it
            was assembled. Errors come back the same way, as 4xx, never 5xx.
          </p>
        </div>
        <div className="relative isolate">
          <span aria-hidden className="blob blob-agent -top-8 -right-8 h-40 w-48" />
          <Window title={<span>POST {SERVICES.cite.prefix}/v1/verify</span>} right={`${SERVICES.cite.id} · ${ONCHAIN.services.cite.cupr.toLocaleString("en-US")} CU`} className="text-left">
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6" tabIndex={0}>
              <code>
                {`curl -s -X POST ${site.api}${SERVICES.cite.prefix}/v1/verify \\
  -H 'content-type: application/json' \\
  -d '{"citations":["${EXAMPLE_CITATION}"]}'`}
              </code>
            </pre>
            <div className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground">returns</div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6 text-go" tabIndex={0}>
              <code>{`{
  "status": "complete",
  "summary": { "not_found": 1 },
  "results": [{
    "verdict": "not_found",
    "reasons": ["page 1339 falls inside J.D. v. Azar (925 F.3d 1291-1349); no case starts there"]
  }],
  "sources": [{ "status": "ok", "licence": "CC0" }]
}`}</code>
            </pre>
          </Window>
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center md:py-24">
          <p className="label">What a check looks like</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance md:text-5xl">
            An AI says it. Akashi reads the record.
          </h2>
          <ClaimCheck className="mt-10 text-left" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <p className="label text-center">Three checks, three Pocket services</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {SERVICE_ORDER.map((key) => (
            <li key={key} className="card card-hover flex flex-col p-6">
              <span className={`grid size-12 place-items-center rounded-(--radius) font-mark text-2xl leading-none ${TILE[key]}`} aria-hidden>
                {SERVICES[key].kanji}
              </span>
              <Link href={`/docs/services/${key}`} className="mt-5 font-display text-2xl leading-tight font-bold tracking-[-0.02em] hover:text-net">
                {SERVICES[key].name}
              </Link>
              <p className="mt-2 text-[15px] text-fd-muted-foreground">{PROMISE[key]}</p>
              <div className="mt-6 border-t border-fd-border pt-4 font-mono text-[11px] text-fd-muted-foreground tabular-nums">
                {SERVICES[key].id} · {ONCHAIN.services[key].cupr.toLocaleString("en-US")} CU
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
