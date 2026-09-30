/** Motion (specs/web.md §2): state changes only, 150–240 ms; the seal press; reduced motion gets cross-fades. */
export const STATE_TRANSITION_MS = 180;
export const MS_PER_SECOND = 1_000;
export const SECONDS_PER_MINUTE = 60;
/** var(--ease-seal) as a motion easing: the brand's one curve. */
export const EASE_SEAL = [0.2, 0.8, 0.2, 1] as const;
