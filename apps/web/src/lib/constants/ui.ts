/** Motion (specs/ui-revamp.md §5): state changes only; the seal press; reduced motion gets cross-fades. */
export const DURATION_FAST_MS = 120; // hover, press, focus
export const STATE_TRANSITION_MS = 180; // state changes: 150–240 ms
export const DURATION_SLOW_MS = 320; // panels landing
export const MS_PER_SECOND = 1_000;
export const SECONDS_PER_MINUTE = 60;
/** var(--ease-seal) as a motion easing: the brand's one curve. */
export const EASE_SEAL = [0.2, 0.8, 0.2, 1] as const;
/** Springs for small physical feedback (settle fast, no jello). */
export const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 36 } as const;
export const SPRING_POP = { type: "spring", stiffness: 640, damping: 24, mass: 0.7 } as const;
/** lucide stroke width everywhere */
export const ICON_STROKE = 1.5;
