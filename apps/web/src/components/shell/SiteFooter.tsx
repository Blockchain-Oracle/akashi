import { BRAND, SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal } from "@akashi/brand/react";
import { explorerService, ONCHAIN } from "@akashi/ui/onchain";

import { docsPage, REPO_URL } from "@/lib/constants/site";

const SHORT_HEAD = 8;
const SHORT_TAIL = 6;
const short = (s: string) => `${s.slice(0, SHORT_HEAD)}…${s.slice(-SHORT_TAIL)}`;

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Services",
    links: SERVICE_ORDER.map((key) => ({ label: `${SERVICES[key].kanji} ${SERVICES[key].name}`, href: docsPage(`services/${key}`) })),
  },
  {
    title: "Build",
    links: [
      { label: "What is Akashi?", href: docsPage() },
      { label: "Call it from an agent", href: docsPage("pocket/from-an-agent") },
      { label: "API reference", href: docsPage("reference") },
      { label: "Source", href: REPO_URL },
    ],
  },
  {
    title: "Pocket",
    links: [
      { label: "How a call flows", href: docsPage("pocket/how-a-call-flows") },
      { label: "Paying for a call", href: docsPage("pocket/payment") },
      { label: "Registered on Beta", href: docsPage("pocket/registration") },
      { label: "For judges", href: docsPage("judges") },
    ],
  },
];

/** The footer: the tagline, three columns, and the on-chain record in mono. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-band">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Seal className="size-10" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{BRAND.tagline}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="label">{col.title}</div>
            <ul className="mt-3 space-y-2 text-[15px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-foreground/85 transition-colors duration-(--duration-fast) hover:text-link">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 font-mono text-[11px] text-muted-foreground sm:px-8">
          <span>owner {short(ONCHAIN.owner)}</span>
          <span>
            heights {ONCHAIN.services.cite.height.toLocaleString("en-US")}–{ONCHAIN.services.now.height.toLocaleString("en-US")}
          </span>
          {SERVICE_ORDER.map((key) => (
            <a key={key} href={explorerService(SERVICES[key].id)} className="hover:text-link">
              {SERVICES[key].id}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
