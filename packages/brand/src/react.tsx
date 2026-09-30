/**
 * The seal and wordmark as React components, shared by apps/web and apps/docs. Colours come from tokens only:
 * frame, glyph and letters take the current text colour; the check is var(--primary), the mark's one colour.
 */
import { BRAND, TONES, type VerdictGlyph, type VerdictTone } from "./index";
import { SEAL, WORDMARK } from "./marks.generated";

const DEFAULT_SEAL_LABEL = `${BRAND.name} ${BRAND.kanji} seal`;
const CHECK_STYLE = { stroke: "var(--primary)" } as const;

function join(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** `label={null}` marks the seal decorative (when a visible name stands next to it). */
export function Seal({ className, label = DEFAULT_SEAL_LABEL }: { className?: string; label?: string | null }) {
  const a11y = label === null ? { "aria-hidden": true } : { role: "img", "aria-label": label };
  return (
    <svg viewBox={SEAL.viewBox} className={join("shrink-0", className)} {...a11y}>
      <g fill="none" stroke="currentColor" strokeLinecap="square">
        <path d={SEAL.outer.d} strokeWidth={SEAL.outer.strokeWidth} />
        <path d={SEAL.inner.d} strokeWidth={SEAL.inner.strokeWidth} />
      </g>
      <path d={SEAL.glyph} fill="currentColor" />
      <polyline
        points={SEAL.check.points}
        fill="none"
        style={CHECK_STYLE}
        strokeWidth={SEAL.check.strokeWidth}
        strokeLinecap="square"
      />
    </svg>
  );
}

/** AKASHI | 証, outlined. `kanji={false}` gives the letters alone, for next to the seal. */
export function Wordmark({ className, kanji = true }: { className?: string; kanji?: boolean }) {
  return (
    <svg
      viewBox={kanji ? WORDMARK.viewBox : WORDMARK.lettersViewBox}
      className={join("shrink-0", className)}
      role="img"
      aria-label={BRAND.wordmark}
    >
      <path d={WORDMARK.letters} fill="currentColor" />
      {kanji && (
        <>
          <path d={WORDMARK.rule.d} stroke="currentColor" strokeWidth={WORDMARK.rule.strokeWidth} />
          <path d={WORDMARK.kanji} fill="currentColor" />
        </>
      )}
    </svg>
  );
}

/** The six verdict glyphs on a 24-unit grid (specs/web.md §2), drawn in currentColor: always shown with the word. */
const GLYPH_STROKE = 1.75;
const GLYPH_RADIUS = 8;
const GLYPH_CENTER = 12;
const GLYPH_DASH = "3 3";

const GLYPH_PATHS: Record<VerdictGlyph, React.ReactNode> = {
  tick: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  "split-diamond": <path d="M12 3l9 9-9 9-9-9zM12 3v18" />,
  "empty-circle": <circle cx={GLYPH_CENTER} cy={GLYPH_CENTER} r={GLYPH_RADIUS} />,
  "struck-circle": (
    <>
      <circle cx={GLYPH_CENTER} cy={GLYPH_CENTER} r={GLYPH_RADIUS} />
      <path d="M6.3 17.7L17.7 6.3" />
    </>
  ),
  fork: <path d="M12 20v-6M12 14L6 5M12 14l6-9" />,
  "dashed-circle": <circle cx={GLYPH_CENTER} cy={GLYPH_CENTER} r={GLYPH_RADIUS} strokeDasharray={GLYPH_DASH} />,
};

export function VerdictGlyph({ tone, className }: { tone: VerdictTone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={GLYPH_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={join("shrink-0", className)}
      aria-hidden
    >
      {GLYPH_PATHS[TONES[tone].glyph]}
    </svg>
  );
}
