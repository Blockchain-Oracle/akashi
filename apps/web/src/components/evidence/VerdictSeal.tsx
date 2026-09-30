"use client";

import { VerdictGlyph } from "@akashi/brand/react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { TONE_RING, TONE_TEXT, toneOf } from "./tones";

// The signature seal press (specs/web.md §2): 1.06 → 1 as the verdict lands, with a 120 ms ink bloom.
const PRESS_FROM = 1.06;
const PRESS_S = 0.24;
const BLOOM_S = 0.12;
const BLOOM_TO = 1.6;
const EASE_X1 = 0.2;
const EASE_Y1 = 0.8;
const EASE_X2 = 0.2;
const EASE: [number, number, number, number] = [EASE_X1, EASE_Y1, EASE_X2, 1];

/** A verdict: glyph + word + colour, pressed like a seal when it lands. */
export function VerdictSeal({ word, size = "md", className }: { word: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tone = toneOf(word);
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: PRESS_FROM }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: PRESS_S, ease: EASE }}
      className={cn(
        "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip border font-mono font-medium",
        TONE_RING[tone],
        TONE_TEXT[tone],
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        size === "lg" && "px-3 py-1.5 text-sm",
        className,
      )}
    >
      {!reduce && (
        <motion.span
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 rounded-chip border", TONE_RING[tone])}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: BLOOM_TO }}
          transition={{ duration: BLOOM_S * 2, ease: "easeOut" }}
        />
      )}
      <VerdictGlyph tone={tone} className={size === "lg" ? "size-4" : "size-3.5"} />
      {word.replaceAll("_", " ")}
    </motion.span>
  );
}
