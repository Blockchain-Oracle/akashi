import { Seal, Wordmark } from "@akashi/brand/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { DOCS_URL, REPO_URL } from "@/lib/constants/site";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-3 text-foreground" aria-label="Akashi home">
          <Seal className="size-8" label={null} />
          <Wordmark className="h-3.5 w-auto" kanji={false} />
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href={DOCS_URL} className="inline-flex items-center gap-1 hover:text-foreground">
            Docs <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden />
          </a>
          <a href={REPO_URL} className="hover:text-foreground">
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
