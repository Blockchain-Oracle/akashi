"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** Washi ⇄ sumi. Both icons render and CSS picks one, so the server and first client paint agree. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const next = resolvedTheme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label="Toggle colour theme"
      className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors duration-(--duration-state) hover:bg-accent hover:text-foreground"
    >
      <Sun className="size-4 dark:hidden" strokeWidth={1.5} aria-hidden />
      <Moon className="hidden size-4 dark:block" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
