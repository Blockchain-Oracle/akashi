"use client";

import { motion } from "motion/react";

import type { DeskMode } from "@/lib/constants/desk";
import { cn } from "@/lib/utils";

const MODES: { value: DeskMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "cite", label: "Cite" },
  { value: "code", label: "Code" },
  { value: "now", label: "Now" },
];
const SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;

/** Auto-detect, or force a service (segmented control, after 21st.dev micka_design/segmented-tabs 26923). */
export function ModeTabs({ value, onChange }: { value: DeskMode; onChange: (m: DeskMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Which check" className="inline-flex rounded-chip border border-border p-0.5 text-xs">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={value === m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "relative rounded-chip px-2.5 py-1 font-medium transition-colors",
            value === m.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === m.value && <motion.span layoutId="desk-mode" className="absolute inset-0 rounded-chip bg-secondary" transition={SPRING} />}
          <span className="relative">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
