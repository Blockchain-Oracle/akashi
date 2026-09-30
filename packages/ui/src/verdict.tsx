import { type VerdictTone } from "@akashi/brand";
import { VerdictGlyph } from "@akashi/brand/react";

import { cn } from "./cn";

// Tailwind needs the full class names in source; these map each tone to its token colour.
const TONE_CLASS: Record<VerdictTone, string> = {
  verified: "text-verdict-verified",
  mismatch: "text-verdict-mismatch",
  "not-found": "text-verdict-not-found",
  retracted: "text-verdict-retracted",
  ambiguous: "text-verdict-ambiguous",
  unknown: "text-verdict-unknown",
};

/** A verdict is always glyph + word + colour. */
export function Verdict({ tone, word, className }: { tone: VerdictTone; word: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs font-medium", TONE_CLASS[tone], className)}>
      <VerdictGlyph tone={tone} className="size-3.5" />
      {word}
    </span>
  );
}
