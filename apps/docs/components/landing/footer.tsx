import { BRAND, SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal, Wordmark } from "@akashi/brand/react";
import { explorerService, ONCHAIN } from "@akashi/ui/onchain";
import Link from "next/link";

import { site } from "@/lib/site";

const SHORT_HEAD = 8;
const SHORT_TAIL = 6;
const short = (s: string) => `${s.slice(0, SHORT_HEAD)}…${s.slice(-SHORT_TAIL)}`;
const YEAR = 2026;

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Start here",
    links: [
      { label: "What is Akashi?", href: "/docs" },
      { label: "How it runs on Pocket", href: "/docs/pocket/how-a-call-flows" },
      { label: "For judges", href: "/docs/judges" },
    ],
  },
  {
    title: "Services",
    links: SERVICE_ORDER.map((key) => ({ label: `${SERVICES[key].kanji} ${SERVICES[key].name}`, href: `/docs/services/${key}` })),
  },
  {
    title: "Types",
    links: [
      { label: "The response", href: "/docs/contract/response" },
      { label: "API reference", href: "/docs/reference" },
      { label: "llms.txt", href: "/llms.txt" },
    ],
  },
  {
    title: "Akashi",
    links: [
      { label: "The desk", href: site.app, external: true },
      { label: "Talk to the agent", href: `${site.app}/agent`, external: true },
      { label: "GitHub", href: site.repo, external: true },
    ],
  },
];

/** HTTPie's footer: a grey band, the mark, four columns, the legal line with the on-chain ids. */
export function Footer() {
  return (
    <footer className="bg-band-2 text-fd-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <span className="inline-flex items-center gap-3">
            <Seal className="size-9" label={null} />
            <Wordmark className="h-4 w-auto" kanji={false} />
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-fd-muted-foreground">{BRAND.tagline}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold">{col.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-fd-foreground/75">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} className="hover:text-fd-foreground">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:text-fd-foreground">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 pb-10 font-mono text-[11px] text-fd-muted-foreground">
        <span>© {YEAR} Akashi · Pocket Network Beta</span>
        <span>owner {short(ONCHAIN.owner)}</span>
        <span>
          heights {ONCHAIN.services.cite.height.toLocaleString("en-US")}–{ONCHAIN.services.now.height.toLocaleString("en-US")}
        </span>
        {SERVICE_ORDER.map((key) => (
          <a key={key} href={explorerService(SERVICES[key].id)} className="hover:text-fd-foreground" rel="noreferrer" target="_blank">
            {SERVICES[key].id}
          </a>
        ))}
      </div>
    </footer>
  );
}
