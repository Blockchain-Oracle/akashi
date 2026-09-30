import type { NowSchemas } from "@akashi/api-client";
import { ArrowUpRight } from "lucide-react";

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
    <article className="rounded-lg border border-border bg-card">
      <div className="border-border border-b px-5 py-3 font-mono text-muted-foreground text-xs uppercase tracking-widest">
        {results.length} {kind === "holiday" ? "holidays" : kind === "news_story" ? "stories" : "results"}
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r, i) => {
          if (kind === "holiday") {
            const h = r as Holiday;
            return (
              <li key={`${h.date}-${h.name}`} className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm">
                <span>
                  <span className="font-mono text-muted-foreground">{h.date}</span> {h.name}
                </span>
                <span className="font-mono text-muted-foreground text-xs">{h.listed_by.join(" · ")}</span>
              </li>
            );
          }
          const story = r as Partial<Story> & Partial<Job>;
          const where = [story.domain ?? story.company, story.location, (story.seen_at ? isoMinute(story.seen_at) : null) ?? (story.posted_at ? isoDate(story.posted_at) : null)];
          return (
            <li key={story.url ?? i} className="px-5 py-2.5 text-sm">
              <a href={story.url ?? undefined} className="inline-flex items-start gap-1 hover:text-primary">
                {story.title} <ArrowUpRight className="mt-1 size-3 shrink-0" aria-hidden />
              </a>
              <div className="font-mono text-muted-foreground text-xs">{where.filter(Boolean).join(" · ")}</div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
