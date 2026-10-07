import { SOURCES } from "@/lib/constants/story";

/** HTTPie's "Trusted by the best" logo circles, honest version: the records the services read, as monograms. */
export function SourceCircles() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-7 sm:gap-x-7">
      {SOURCES.map((s) => (
        <li key={s.name} className="flex w-20 flex-col items-center gap-2 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-card font-mono text-[13px] font-semibold tracking-tight shadow-1" title={s.name}>
            {s.short}
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">{s.name}</span>
        </li>
      ))}
    </ul>
  );
}
