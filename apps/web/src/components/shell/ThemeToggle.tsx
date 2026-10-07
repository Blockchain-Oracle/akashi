"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ICON_STROKE } from "@/lib/constants/ui";

/**
 * Light ⇄ dark as a labelled switch (HTTPie's footer toggle). Both icons render and CSS picks one, so the server and
 * the first client paint agree.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle colour theme"
      className="group inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground"
    >
      <span className="relative inline-flex h-7 w-12 items-center rounded-chip border border-border-2 bg-card p-0.5 shadow-1">
        <span className="grid size-6 place-items-center rounded-full bg-foreground text-background transition-transform duration-(--duration-state) ease-(--ease-seal) dark:translate-x-5">
          <Sun className="size-3.5 dark:hidden" strokeWidth={ICON_STROKE} aria-hidden />
          <Moon className="hidden size-3.5 dark:block" strokeWidth={ICON_STROKE} aria-hidden />
        </span>
      </span>
      <span className="font-mono text-[11px] tracking-(--tracking-label) uppercase">
        <span className="dark:hidden">Light mode</span>
        <span className="hidden dark:inline">Dark mode</span>
      </span>
    </button>
  );
}
