"use client";

// 21st.dev Number Ticker (19063, danielpetho), adapted: counts up once when scrolled into view, formats decimals and
// thousands, shows the final value at once under reduced motion, and gives screen readers the final number only.
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import { TICKER_DURATION_S } from "@/lib/constants/story";
import { EASE_SEAL } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

export function NumberTicker({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const format = useMemo(
    () => new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    [decimals],
  );
  const text = useTransform(count, (latest) => format.format(latest));

  useEffect(() => {
    if (reduce) {
      count.set(value);
      return;
    }
    if (!inView) return;
    const controls = animate(count, value, { duration: TICKER_DURATION_S, ease: EASE_SEAL });
    return () => controls.stop();
  }, [count, inView, reduce, value]);

  return (
    <>
      <motion.span ref={ref} aria-hidden className={cn("tabular-nums", className)}>
        {text}
      </motion.span>
      <span className="sr-only">{format.format(value)}</span>
    </>
  );
}
