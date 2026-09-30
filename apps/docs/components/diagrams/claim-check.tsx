"use client";

import { type VerdictTone } from "@akashi/brand";
import { Seal } from "@akashi/brand/react";
import { Bot } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Verdict } from "@/components/landing/verdict";
import { cn } from "@/lib/cn";

const ICON_STROKE = 1.5;
const ROW_STAGGER_S = 0.35;
const RISE_PX = 12;
const EASE_X1 = 0.16; // cubic-bezier(0.16, 1, 0.3, 1)
const EASE_X2 = 0.3;
const EASE: [number, number, number, number] = [EASE_X1, 1, EASE_X2, 1];
const DURATION_S = 0.6;

// Three real checks (answers from the running service, 2026-09-30).
const CASES: { says: string; tone: VerdictTone; word: string; found: string; where: string }[] = [
  {
    says: "See Varghese v. China Southern Airlines, 925 F.3d 1339 (2019).",
    tone: "not-found",
    word: "not found",
    found: "This court case does not exist. Page 1339 is in the middle of a different case.",
    where: "US court records",
  },
  {
    says: "Run pip install reqeusts to get started.",
    tone: "not-found",
    word: "does not exist",
    found: "There is no package with that name. You probably mean requests.",
    where: "the Python package registry",
  },
  {
    says: "One US dollar buys about 0.92 euros.",
    tone: "verified",
    word: "current rate",
    found: "0.8807 euros, as published by the European Central Bank on 29 September 2026. Other central banks agree.",
    where: "central banks",
  },
];

/** An AI's claim, what Akashi found, and where it looked: the whole idea in three rows. */
export function ClaimCheck({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("not-prose space-y-4", className)}>
      {CASES.map((c, i) => (
        <motion.div
          key={c.says}
          initial={reduce ? false : { opacity: 0, y: RISE_PX }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: DURATION_S, ease: EASE, delay: i * ROW_STAGGER_S }}
          className="grid gap-3 md:grid-cols-2 md:gap-4"
        >
          <div className="flex gap-3 rounded-2xl border border-fd-border bg-fd-background p-4">
            <Bot className="mt-0.5 size-5 shrink-0 text-fd-muted-foreground" strokeWidth={ICON_STROKE} />
            <div>
              <div className="text-fd-muted-foreground text-xs">An AI assistant says</div>
              <p className="mt-1 text-sm">“{c.says}”</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-fd-border bg-fd-card p-4">
            <Seal className="mt-0.5 size-6 shrink-0" label={null} />
            <div>
              <Verdict tone={c.tone} word={c.word} />
              <p className="mt-1 text-sm">{c.found}</p>
              <div className="mt-1 text-fd-muted-foreground text-xs">Checked against {c.where}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
