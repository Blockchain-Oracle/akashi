import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { GitHubMark } from "@/components/common/GitHubMark";
import { NAV, REPO_URL, docsPage } from "@/lib/constants/site";

/** Monid's header: wordmark left, four links centred, icon links + a quiet "Get started" pill right. */
export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 text-[0.9375rem] md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                active === item.label
                  ? "font-medium text-foreground"
                  : "text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            className="hidden size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            aria-label="Akashi on GitHub"
          >
            <GitHubMark className="size-[18px]" />
          </a>
          <a
            href={docsPage("quickstart")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-muted px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-line"
          >
            Get started <ArrowRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </header>
  );
}
