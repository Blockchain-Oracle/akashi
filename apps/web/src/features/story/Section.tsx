import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One story section: a short lemon bar, a mono eyebrow, a display heading and its figure. Sections alternate the
 * canvas and the band; `tone="console"` puts the section inside the one Deep-Midnight showcase card.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  split = false,
  tone = "canvas",
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  children: ReactNode;
  /** heading on the left, the figure on the right (from md up) */
  split?: boolean;
  tone?: "canvas" | "band" | "console";
  className?: string;
}) {
  const header = (
    <div>
      <span className="eyebrow-bar" aria-hidden />
      <p className="label mt-4">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance md:text-5xl">
        {title}
      </h2>
      {lead && <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">{lead}</p>}
    </div>
  );
  const body = (
    <div className={cn(split && "md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-start md:gap-12")}>
      {header}
      <div className={cn("mt-10", split && "md:mt-0")}>{children}</div>
    </div>
  );
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20 py-16 md:py-24", tone === "band" && "bg-band", className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {tone === "console" ? <div className="console rounded-(--radius-xl) px-6 py-10 shadow-2 sm:px-10 md:px-14 md:py-14">{body}</div> : body}
      </div>
    </section>
  );
}
