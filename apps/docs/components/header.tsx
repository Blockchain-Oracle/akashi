"use client";

import { Seal, Wordmark } from "@akashi/brand/react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";
import { ArrowUpRight, Menu, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { site } from "@/lib/site";

const ICON_STROKE = 1.5;

/** The docs' own header (the default Fumadocs one is mobile-only): the same seal, name and controls as the app. */
export function Header() {
  const { setOpenSearch } = useSearchContext();
  const { resolvedTheme, setTheme } = useTheme();
  const { slots } = useDocsLayout();
  return (
    <header className="docs-header">
      <Link href="/" className="docs-brand" aria-label="Akashi documentation home">
        <Seal className="docs-brand-seal" label={null} />
        <Wordmark className="docs-brand-word" kanji={false} />
        <span className="docs-brand-tag">Docs</span>
      </Link>
      <div className="docs-header-actions">
        <button type="button" className="docs-search" onClick={() => setOpenSearch(true)}>
          <Search strokeWidth={ICON_STROKE} aria-hidden />
          <span>Search the docs</span>
          <kbd>⌘K</kbd>
        </button>
        <button
          type="button"
          className="docs-icon-button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle colour theme"
        >
          <Sun className="docs-icon-light" strokeWidth={ICON_STROKE} aria-hidden />
          <Moon className="docs-icon-dark" strokeWidth={ICON_STROKE} aria-hidden />
        </button>
        <a className="docs-open-app" href={site.app}>
          Open Akashi <ArrowUpRight strokeWidth={ICON_STROKE} aria-hidden />
        </a>
        {slots.sidebar && (
          <slots.sidebar.trigger className="docs-icon-button docs-menu" aria-label="Open the documentation menu">
            <Menu strokeWidth={ICON_STROKE} aria-hidden />
          </slots.sidebar.trigger>
        )}
      </div>
    </header>
  );
}

export function EmptySlot() {
  return null;
}
