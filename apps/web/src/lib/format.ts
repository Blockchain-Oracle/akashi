/** ISO 8601 pieces, by position: "2026-11-15T18:00:00+00:00". */
const DATE_END = 10; // "2026-11-15"
const CLOCK_START = 11;
const CLOCK_END = 16; // "18:00"

export const isoDate = (iso: string) => iso.slice(0, DATE_END);
export const isoClock = (iso: string) => iso.slice(CLOCK_START, CLOCK_END);
export const isoMinute = (iso: string) => iso.slice(0, CLOCK_END).replace("T", " ");
