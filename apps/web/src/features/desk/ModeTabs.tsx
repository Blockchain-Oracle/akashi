"use client";

import { SERVICES } from "@akashi/brand";
import { motion } from "motion/react";

import type { DeskMode } from "@/lib/constants/desk";
import { SPRING_SNAPPY } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

const MODES: { value: DeskMode; label: string; kanji?: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "cite", label: "Cite", kanji: SERVICES.cite.kanji },
  { value: "code", label: "Code", kanji: SERVICES.code.kanji },
  { value: "now", label: "Now", kanji: SERVICES.now.kanji },
];

/** Auto-detect, or force a service: a pill strip inside the window; the active pill is green (21st 26923 grammar). */
export function ModeTabs({ value, onChange }: { value: DeskMode; onChange: (m: DeskMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Which check" className="inline-flex rounded-chip bg-band p-1 text-sm">
      {MODES.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 font-medium transition-colors duration-(--duration-fast)",
              active ? "text-go-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && <motion.span layoutId="desk-mode" className="absolute inset-0 rounded-chip bg-go" transition={SPRING_SNAPPY} />}
            {m.kanji && (
              <span className="relative font-mark text-xs leading-none" aria-hidden>
                {m.kanji}
              </span>
            )}
            <span className="relative">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
