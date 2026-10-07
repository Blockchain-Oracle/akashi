import { Seal, Wordmark } from "@akashi/brand/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { GithubMark } from "@/components/ui/github-mark";
import { AGENT_PATH, DESK_ANCHOR, docsPage, REPO_URL } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

/** HTTPie's nav grammar: the mark, plain text links, a repo icon, one green pill. */
const LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Desk", href: DESK_ANCHOR },
  { label: "Agent", href: AGENT_PATH },
  { label: "Docs", href: docsPage(), external: true },
  { label: "Judges", href: docsPage("judges"), external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="Akashi home">
          <Seal className="size-8" label={null} />
          <Wordmark className="h-3.5 w-auto" kanji={false} />
        </Link>
        <nav aria-label="Site" className="hidden items-center gap-7 text-[15px] font-medium text-foreground/80 md:flex">
          {LINKS.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} className="transition-colors duration-(--duration-fast) hover:text-foreground">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="transition-colors duration-(--duration-fast) hover:text-foreground">
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-4">
          <a href={REPO_URL} className="text-foreground/70 transition-colors duration-(--duration-fast) hover:text-foreground" aria-label="Akashi on GitHub" rel="noreferrer" target="_blank">
            <GithubMark className="size-5" />
          </a>
          <Link href={AGENT_PATH} className="btn btn-go px-4 py-2 text-sm whitespace-nowrap">
            <span className="sm:hidden">Agent</span>
            <span className="hidden sm:inline">Talk to the agent</span>
            <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
