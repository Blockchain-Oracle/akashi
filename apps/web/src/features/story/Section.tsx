import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** One story section: a mono eyebrow, a display heading (one italic word at most), then its figure. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  split = false,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  children: ReactNode;
  /** heading on the left, the figure on the right (from md up) */
  split?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn("pt-24 md:pt-32", split && "md:grid md:grid-cols-2 md:items-center md:gap-12", className)}
    >
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-3 max-w-2xl text-balance font-display text-3xl leading-tight md:text-4xl">
          {title}
        </h2>
        {lead && <p className="mt-3 max-w-xl text-balance text-muted-foreground">{lead}</p>}
      </div>
      <div className={cn("mt-8", split && "md:mt-0")}>{children}</div>
    </section>
  );
}
