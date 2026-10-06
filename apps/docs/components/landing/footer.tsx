import { BRAND, SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal } from "@akashi/brand/react";
import { explorerService, ONCHAIN } from "@akashi/ui/onchain";
import Link from "next/link";

import { site } from "@/lib/site";

const SHORT_HEAD = 8;
const SHORT_TAIL = 6;
const short = (s: string) => `${s.slice(0, SHORT_HEAD)}…${s.slice(-SHORT_TAIL)}`;

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
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
];

/** The ledger's last rows: the tagline, three mono columns, and the on-chain record. */
export function Footer() {
  return (
    <footer className="border-t border-fd-border bg-band">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Seal className="size-9" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-fd-muted-foreground">{BRAND.tagline}</p>
          <a href={site.app} className="mt-4 inline-block text-sm text-fd-primary hover:underline">
            Open the desk →
          </a>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="label">{col.title}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-fd-foreground/85 hover:text-link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-fd-border bg-band">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 font-mono text-[11px] text-fd-muted-foreground">
          <span>owner {short(ONCHAIN.owner)}</span>
          <span>
            heights {ONCHAIN.services.cite.height.toLocaleString("en-US")}–{ONCHAIN.services.now.height.toLocaleString("en-US")}
          </span>
          {SERVICE_ORDER.map((key) => (
            <a key={key} href={explorerService(SERVICES[key].id)} className="hover:text-fd-primary">
              {SERVICES[key].id}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
