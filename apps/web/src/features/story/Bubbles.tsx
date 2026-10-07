import { SERVICES } from "@akashi/brand";

import { VerdictStamp } from "@/components/evidence/VerdictStamp";
import { Bubble, type BubbleTail } from "@/components/ui/bubble";
import { SERVICE_TONE } from "@/lib/constants/services";
import { CLAIMS } from "@/lib/constants/story";

const TAILS: BubbleTail[] = ["bl", "tl", "br", "tr", "bl", "tr"];

/**
 * "Said with confidence": six things assistants have said, in HTTPie's testimonial bubbles. The colour is the
 * service that checked the claim (D-034); the verdict stamp carries the answer; the record it was read against sits
 * underneath.
 */
export function Bubbles() {
  return (
    <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5 [&>li]:break-inside-avoid">
      {CLAIMS.map((c, i) => (
        <Bubble key={c.says} as="li" tone={SERVICE_TONE[c.service]} tail={TAILS[i % TAILS.length] ?? "bl"} className="shadow-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[17px] leading-snug font-medium text-pretty">“{c.says}”</p>
            <span className="font-mark text-xl leading-none opacity-60" aria-hidden>
              {SERVICES[c.service].kanji}
            </span>
          </div>
          <div className="mt-4 rounded-(--radius) bg-card/90 p-3 text-card-foreground">
            <VerdictStamp word={c.verdict} size="sm" />
            <p className="mt-2 text-sm leading-snug text-pretty">{c.found}</p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">read against {c.where}</p>
          </div>
        </Bubble>
      ))}
    </ul>
  );
}
