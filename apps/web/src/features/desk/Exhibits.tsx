import { SERVICES } from "@akashi/brand";

import { EXHIBITS, type Exhibit } from "@/lib/constants/desk";

/**
 * Real cases, one tap each: six white chips under the desk (Superthread's tab strip, cdr-kit's package chips). Each
 * names the question its check answers, so nothing is promised before the records are read.
 */
export function Exhibits({ onPick }: { onPick: (exhibit: Exhibit) => void }) {
  return (
    <ul aria-label="Exhibits" className="flex flex-wrap gap-2.5">
      {EXHIBITS.map((e) => (
        <li key={e.label}>
          <button type="button" onClick={() => onPick(e)} className="card card-hover group flex items-center gap-3 rounded-(--radius) px-3.5 py-2.5 text-left">
            <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-marker-soft font-mark text-base leading-none" aria-hidden>
              {SERVICES[e.service].kanji}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] leading-tight font-medium">{e.label}</span>
              <span className="block font-mono text-[11px] text-muted-foreground transition-colors duration-(--duration-fast) group-hover:text-foreground">
                {e.question} →
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
