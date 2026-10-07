import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One story section in HTTPie's grammar: a mono eyebrow, a bold heading, a lead; centred by default. Tones: the
 * canvas, the grey band, a rounded grey blob band (the one grey moment), or the blue band (`band-net`).
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  align = "center",
  tone = "canvas",
  className,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  children: ReactNode;
  align?: "center" | "left";
  tone?: "canvas" | "band" | "blob" | "net";
  className?: string;
}) {
  const centered = align === "center";
  const header = (
    <div className={cn(centered && "mx-auto text-center")}>
      {eyebrow && <p className="label">{eyebrow}</p>}
      <h2
        id={`${id}-title`}
        className={cn("mt-3 font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em] text-balance md:text-5xl", centered ? "mx-auto max-w-3xl" : "max-w-2xl")}
      >
        {title}
      </h2>
      {lead && <p className={cn("mt-4 max-w-xl text-lg text-pretty text-muted-foreground", centered && "mx-auto")}>{lead}</p>}
    </div>
  );
  const body = (
    <>
      {header}
      <div className="mt-10 md:mt-12">{children}</div>
    </>
  );
  if (tone === "blob") {
    return (
      <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20 py-10 md:py-14", className)}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="rounded-(--radius-2xl) bg-band px-6 py-14 sm:px-10 md:px-16 md:py-20">{body}</div>
        </div>
      </section>
    );
  }
  if (tone === "net") {
    return (
      <section id={id} aria-labelledby={`${id}-title`} className={cn("band-net scroll-mt-20 py-16 md:py-24", className)}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">{body}</div>
      </section>
    );
  }
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-20 py-16 md:py-24", tone === "band" && "bg-band", className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{body}</div>
    </section>
  );
}
