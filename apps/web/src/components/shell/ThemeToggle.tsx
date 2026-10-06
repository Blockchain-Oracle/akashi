"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ICON_STROKE } from "@/lib/constants/ui";

/** Light ⇄ midnight. Both icons render and CSS picks one, so the server and first client paint agree. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label="Toggle colour theme"
      className="grid size-9 place-items-center rounded-full border border-border-2 bg-card text-muted-foreground shadow-1 transition-colors duration-(--duration-fast) hover:border-faint-foreground hover:text-foreground"
    >
      <Sun className="size-4 dark:hidden" strokeWidth={ICON_STROKE} aria-hidden />
      <Moon className="hidden size-4 dark:block" strokeWidth={ICON_STROKE} aria-hidden />
    </button>
  );
}
