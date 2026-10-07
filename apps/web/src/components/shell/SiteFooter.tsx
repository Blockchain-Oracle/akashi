import { BRAND, SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal, Wordmark } from "@akashi/brand/react";
import { explorerService, ONCHAIN } from "@akashi/ui/onchain";
import Link from "next/link";

import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { AGENT_PATH, DESK_ANCHOR, docsPage, POCKET_URL, REPO_URL } from "@/lib/constants/site";

const SHORT_HEAD = 8;
const SHORT_TAIL = 6;
const short = (s: string) => `${s.slice(0, SHORT_HEAD)}…${s.slice(-SHORT_TAIL)}`;
const YEAR = 2026;

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Akashi",
    links: [
      { label: "The desk", href: DESK_ANCHOR },
      { label: "Talk to the agent", href: AGENT_PATH },
      { label: "Docs", href: docsPage(), external: true },
      { label: "API reference", href: docsPage("reference"), external: true },
    ],
  },
  {
    title: "Services",
    links: SERVICE_ORDER.map((key) => ({ label: `${SERVICES[key].kanji} ${SERVICES[key].name}`, href: docsPage(`services/${key}`), external: true })),
  },
  {
    title: "Pocket",
    links: [
      { label: "How a call flows", href: docsPage("pocket/how-a-call-flows"), external: true },
      { label: "Paying for a call", href: docsPage("pocket/payment"), external: true },
      { label: "Registered on Beta", href: docsPage("pocket/registration"), external: true },
      { label: "For judges", href: docsPage("judges"), external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: REPO_URL, external: true },
      { label: "Pocket Network", href: POCKET_URL, external: true },
    ],
  },
];

/** HTTPie's footer: a grey band, the mark, four columns, a labelled theme switch, the legal line with the on-chain ids. */
export function SiteFooter() {
  return (
    <footer className="bg-band-2 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Akashi home">
            <Seal className="size-9" label={null} />
            <Wordmark className="h-4 w-auto" kanji={false} />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{BRAND.tagline}</p>
          <div className="mt-6">
            <ThemeToggle />
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold">{col.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/75">
              {col.links.map((l) =>
                l.external ? (
                  <li key={l.href}>
                    <a href={l.href} className="transition-colors duration-(--duration-fast) hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors duration-(--duration-fast) hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 pb-10 font-mono text-[11px] text-muted-foreground sm:px-8">
        <span>© {YEAR} Akashi · Pocket Network Beta</span>
        <span>owner {short(ONCHAIN.owner)}</span>
        <span>
          heights {ONCHAIN.services.cite.height.toLocaleString("en-US")}–{ONCHAIN.services.now.height.toLocaleString("en-US")}
        </span>
        {SERVICE_ORDER.map((key) => (
          <a key={key} href={explorerService(SERVICES[key].id)} className="hover:text-foreground" rel="noreferrer" target="_blank">
            {SERVICES[key].id}
          </a>
        ))}
      </div>
    </footer>
  );
}
