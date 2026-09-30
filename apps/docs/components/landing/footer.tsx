import { BRAND, SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { Seal } from "@akashi/brand/react";
import Link from "next/link";

import { site } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "On Pocket",
    links: [
      { label: "How a call flows", href: "/docs/pocket/how-a-call-flows" },
      { label: "Registration", href: "/docs/pocket/registration" },
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

export function Footer() {
  return (
    <footer className="border-fd-border border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Seal className="size-9" />
          <p className="mt-4 max-w-xs font-mono text-xs text-fd-muted-foreground">{BRAND.tagline}</p>
          <a href={site.app} className="mt-4 inline-block text-sm text-fd-primary">
            Open Akashi →
          </a>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">{col.title}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-fd-foreground/80 hover:text-fd-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
