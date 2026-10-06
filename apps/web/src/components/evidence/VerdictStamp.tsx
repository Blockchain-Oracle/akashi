"use client";

import { VerdictGlyph } from "@akashi/brand/react";
import { motion, useReducedMotion } from "motion/react";

import { EASE_SEAL } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import { TONE_PILL, toneOf } from "./tones";

// The signature seal press: the pill lands at 1.08 → 1 while an ink bloom spreads and fades.
const PRESS_FROM = 1.08;
const PRESS_S = 0.24;
const BLOOM_S = 0.28;
const BLOOM_TO = 1.4;

const SIZE = {
  sm: "px-2 py-0.5 text-[11px] [&_svg]:size-3",
  md: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
  lg: "px-3.5 py-1.5 text-sm [&_svg]:size-4",
} as const;

/** A verdict as a bold tinted pill: glyph + word + colour, pressed like a seal when it lands. */
export function VerdictStamp({ word, size = "md", className }: { word: string; size?: keyof typeof SIZE; className?: string }) {
  const tone = toneOf(word);
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: PRESS_FROM }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: PRESS_S, ease: EASE_SEAL }}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-chip border-[1.5px] font-mono font-semibold whitespace-nowrap",
        TONE_PILL[tone],
        SIZE[size],
        className,
      )}
    >
      {!reduce && (
        <motion.span
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 rounded-chip border-[1.5px]", TONE_PILL[tone])}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: BLOOM_TO }}
          transition={{ duration: BLOOM_S, ease: "easeOut" }}
        />
      )}
      <VerdictGlyph tone={tone} />
      {word.replaceAll("_", " ")}
    </motion.span>
  );
}
