"use client";

// From 21st.dev dillionverma/animated-beam (id 919, Magic UI, MIT), via the user's Logos Kit docs:
// a light travelling along a curved path between two elements.
import { motion } from "motion/react";
import { type RefObject, useEffect, useId, useState } from "react";

import { cn } from "./cn";

const DEFAULT_DURATION_S = 5;
const PATH_WIDTH = 2;
const PATH_OPACITY = 0.15;
const EASE_X1 = 0.16; // cubic-bezier(0.16, 1, 0.3, 1): a fast start that settles
const EASE_X2 = 0.3;
const EASE_OUT: [number, number, number, number] = [EASE_X1, 1, EASE_X2, 1];
const HALF = 2;

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = DEFAULT_DURATION_S,
  delay = 0,
  gradientStartColor = "var(--primary)",
  gradientStopColor = "var(--primary)",
}: {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
}) {
  const id = useId();
  const [d, setD] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const x = reverse ? { x1: ["90%", "-10%"], x2: ["100%", "0%"] } : { x1: ["10%", "110%"], x2: ["0%", "100%"] };

  useEffect(() => {
    const update = () => {
      const c = containerRef.current;
      const a = fromRef.current;
      const b = toRef.current;
      if (!c || !a || !b) return;
      const rc = c.getBoundingClientRect();
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      setSize({ width: rc.width, height: rc.height });
      const sx = ra.left - rc.left + ra.width / HALF;
      const sy = ra.top - rc.top + ra.height / HALF;
      const ex = rb.left - rc.left + rb.width / HALF;
      const ey = rb.top - rc.top + rb.height / HALF;
      setD(`M ${sx},${sy} Q ${(sx + ex) / HALF},${sy - curvature} ${ex},${ey}`);
    };
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    update();
    return () => ro.disconnect();
  }, [containerRef, fromRef, toRef, curvature]);

  return (
    <svg
      aria-hidden
      fill="none"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      className={cn("pointer-events-none absolute top-0 left-0 transform-gpu", className)}
    >
      <path d={d} stroke="currentColor" strokeWidth={PATH_WIDTH} strokeOpacity={PATH_OPACITY} strokeLinecap="round" />
      <path d={d} stroke={`url(#${id})`} strokeWidth={PATH_WIDTH} strokeLinecap="round" />
      <defs>
        <motion.linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={{ x1: x.x1, x2: x.x2, y1: ["0%", "0%"], y2: ["0%", "0%"] }}
          transition={{ delay, duration, ease: EASE_OUT, repeat: Number.POSITIVE_INFINITY }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
