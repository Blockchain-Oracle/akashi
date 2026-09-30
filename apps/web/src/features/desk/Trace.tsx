"use client";

import { VerdictGlyph } from "@akashi/brand/react";
import { LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { SERVICES } from "@/lib/constants/services";
import { MS_PER_SECOND } from "@/lib/constants/ui";

import type { DeskState } from "./useDesk";

const POP = { type: "spring", stiffness: 640, damping: 22, mass: 0.7 } as const;
const POP_FROM = 0.4;

/** The evidence being gathered, one row per item (after 21st.dev ddoemonn/task-steps 23569). */
export function Trace({ state }: { state: DeskState }) {
  if (!state.service) return null;
  const svc = SERVICES[state.service];
  return (
    <ol aria-label="Progress" className="space-y-0.5 font-mono text-xs">
      <li className="flex h-7 items-center gap-2.5 text-muted-foreground">
        <VerdictGlyph tone="verified" className="size-3.5 text-verdict-verified" />
        routed → {svc.id}
      </li>
      {state.items.map((it) => (
        <li key={it.index} aria-current={it.status === "pending" ? "step" : undefined} className="flex h-7 items-center gap-2.5">
          <span className="grid size-3.5 place-items-center">
            <AnimatePresence initial={false} mode="wait">
              {it.status === "pending" ? (
                <motion.span key="spin" exit={{ opacity: 0 }}>
                  <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
                </motion.span>
              ) : (
                <motion.span key="done" initial={{ opacity: 0, scale: POP_FROM }} animate={{ opacity: 1, scale: 1 }} transition={POP}>
                  <VerdictGlyph
                    tone={it.status === "done" ? "verified" : "not-found"}
                    className={it.status === "done" ? "size-3.5 text-verdict-verified" : "size-3.5 text-verdict-not-found"}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="min-w-0 flex-1 truncate">{it.label}</span>
          <span className="text-muted-foreground tabular-nums">{it.ms !== undefined ? `${(it.ms / MS_PER_SECOND).toFixed(2)} s` : ""}</span>
        </li>
      ))}
    </ol>
  );
}
