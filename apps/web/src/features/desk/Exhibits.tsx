import { SERVICES } from "@akashi/brand";

import { EXHIBITS, type Exhibit } from "@/lib/constants/desk";
import { SERVICE_TONE, TONE_TILE } from "@/lib/constants/services";
import { cn } from "@/lib/utils";

/**
 * Real cases, one tap each: the window's action chips (the second reference's prompt-box chips). Each names the
 * question its check answers, so nothing is promised before the records are read; the kanji tile carries the
 * service's accent (D-034).
 */
export function Exhibits({ onPick, className }: { onPick: (exhibit: Exhibit) => void; className?: string }) {
  return (
    <ul aria-label="Exhibits" className={cn("flex flex-wrap justify-center gap-2.5", className)}>
      {EXHIBITS.map((e) => {
        const tone = SERVICE_TONE[e.service];
        return (
          <li key={e.label}>
            <button type="button" onClick={() => onPick(e)} className="card card-hover group flex items-center gap-3 rounded-(--radius) px-3 py-2 text-left">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-(--radius-sm) font-mark text-sm leading-none", TONE_TILE[tone])} aria-hidden>
                {SERVICES[e.service].kanji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-tight font-medium">{e.label}</span>
                <span className="block font-mono text-[11px] text-muted-foreground transition-colors duration-(--duration-fast) group-hover:text-foreground">
                  {e.question} →
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
