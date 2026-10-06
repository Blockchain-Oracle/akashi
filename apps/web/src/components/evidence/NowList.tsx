import type { NowSchemas } from "@akashi/api-client";
import { ArrowUpRight } from "lucide-react";

import { ICON_STROKE } from "@/lib/constants/ui";
import { isoDate, isoMinute } from "@/lib/format";

type Holiday = NowSchemas["HolidayResult"];
type Story = NowSchemas["NewsStory"];
type Job = NowSchemas["Job"];

const MAX_ROWS = 12;

/** List answers (holidays, news, jobs): one row each, with the sources that listed it. */
export function NowList({ results }: { results: { kind: string }[] }) {
  const kind = results[0]?.kind;
  const rows = results.slice(0, MAX_ROWS);
  return (
    <article className="card overflow-hidden">
      <div className="label border-b border-border bg-band px-6 py-3">
        {results.length} {kind === "holiday" ? "holidays" : kind === "news_story" ? "stories" : "results"}
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r, i) => {
          if (kind === "holiday") {
            const h = r as Holiday;
            return (
              <li key={`${h.date}-${h.name}`} className="flex items-baseline gap-3 px-6 py-3 text-[15px]">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{h.date}</span>
                <span className="min-w-0 truncate font-medium">{h.name}</span>
                <span className="leader" aria-hidden />
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{h.listed_by.join(" · ")}</span>
              </li>
            );
          }
          const story = r as Partial<Story> & Partial<Job>;
          const where = [
            story.domain ?? story.company,
            story.location,
            (story.seen_at ? isoMinute(story.seen_at) : null) ?? (story.posted_at ? isoDate(story.posted_at) : null),
          ];
          return (
            <li key={story.url ?? i} className="px-6 py-3 text-[15px]">
              <a href={story.url ?? undefined} className="inline-flex items-start gap-1 font-medium hover:text-link" rel="noreferrer" target="_blank">
                {story.title} <ArrowUpRight className="mt-1 size-3 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
              </a>
              <div className="font-mono text-[11px] text-muted-foreground">{where.filter(Boolean).join(" · ")}</div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
