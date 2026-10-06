"use client";

import { VerdictGlyph } from "@akashi/brand/react";
import { LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { TONE_FILL, TONE_TEXT, toneOf } from "@/components/evidence/tones";
import { SERVICES } from "@/lib/constants/services";
import { MS_PER_SECOND, SPRING_POP } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import { verdictCounts } from "./envelope";
import type { DeskItem, DeskState } from "./useDesk";

const POP_FROM = 0.4;
const SECONDS_DECIMALS = 2;

/** One row of the readout, in the 21st.dev Log Viewer's grammar (31646): status · message · time. */
function Row({ it }: { it: DeskItem }) {
  const done = it.status !== "pending";
  const tone = it.status === "done" ? "verified" : "not-found";
  return (
    <li aria-current={done ? undefined : "step"} className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-3 py-2">
      <span className="grid size-4 place-items-center">
        <AnimatePresence initial={false} mode="wait">
          {done ? (
            <motion.span key="done" initial={{ opacity: 0, scale: POP_FROM }} animate={{ opacity: 1, scale: 1 }} transition={SPRING_POP}>
              <VerdictGlyph tone={tone} className={cn("size-4", TONE_TEXT[tone])} />
            </motion.span>
          ) : (
            <motion.span key="spin" exit={{ opacity: 0 }}>
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className={cn("truncate", done ? "text-foreground" : "text-muted-foreground")}>{it.label}</span>
      <span className={cn("tabular-nums", done ? "text-primary" : "text-muted-foreground")}>
        {it.ms !== undefined ? `${(it.ms / MS_PER_SECOND).toFixed(SECONDS_DECIMALS)} s` : "· · ·"}
      </span>
    </li>
  );
}

/** The run's reading on the Deep-Midnight card: where it was routed, each item as it lands, the verdicts in one bar. */
export function Readout({ state }: { state: DeskState }) {
  if (!state.service) return null;
  const svc = SERVICES[state.service];
  const counts = Object.entries(verdictCounts(state.items)).filter(([, n]) => n > 0);
  const total = counts.reduce((n, [, c]) => n + c, 0);
  const landed = state.items.filter((it) => it.status !== "pending").length;
  const running = state.phase === "running";
  return (
    <section aria-label="Readout" aria-live="polite" className="console readout rounded-(--radius-lg) px-5 py-4 font-mono text-[13px] shadow-2 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
        <span className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-(--radius-sm) bg-primary font-mark text-sm leading-none text-primary-foreground" aria-hidden>
            {svc.kanji}
          </span>
          <span className="text-muted-foreground">routed →</span>
          <span className="font-semibold text-primary">{svc.id}</span>
        </span>
        <span className="text-muted-foreground tabular-nums">
          {running ? `${landed} / ${state.items.length} landed` : `${state.items.length} checked · ${state.elapsedMs ?? 0} ms`}
        </span>
      </div>

      <ol aria-label="Progress" className="mt-3 divide-y divide-border border-y border-border">
        {state.items.map((it) => (
          <Row key={it.index} it={it} />
        ))}
      </ol>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div
            role="img"
            aria-label={counts.map(([w, n]) => `${n} ${w.replaceAll("_", " ")}`).join(", ")}
            className="flex h-2 min-w-32 flex-1 gap-px overflow-hidden rounded-chip bg-muted"
          >
            {counts.map(([word, n]) => (
              <motion.div key={word} layout className={TONE_FILL[toneOf(word)]} style={{ flexGrow: n }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
            ))}
          </div>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {counts.map(([word, n]) => {
              const tone = toneOf(word);
              return (
                <li key={word} className={cn("inline-flex items-center gap-1.5 font-medium", TONE_TEXT[tone])}>
                  <VerdictGlyph tone={tone} className="size-4" />
                  <span className="tabular-nums">{n}</span> {word.replaceAll("_", " ")}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
