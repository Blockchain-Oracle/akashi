import { Seal, Wordmark } from "@akashi/brand/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { DOCS_URL } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

/** Anchors down the page. */
const SECTIONS: { label: string; href: string }[] = [
  { label: "Why", href: "#why" },
  { label: "How", href: "#how" },
  { label: "Services", href: "#services" },
  { label: "Price", href: "#price" },
  { label: "On-chain", href: "#onchain" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="Akashi home">
          <Seal className="size-8" label={null} />
          <Wordmark className="h-3.5 w-auto" kanji={false} />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-7 text-[15px] font-medium text-muted-foreground md:flex">
          {SECTIONS.map((s) => (
            <a key={s.href} href={s.href} className="transition-colors duration-(--duration-fast) hover:text-foreground">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a href={DOCS_URL} className="btn btn-marker px-4 py-2 text-sm">
            Docs <ArrowUpRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
          </a>
        </div>
      </div>
    </header>
  );
}
