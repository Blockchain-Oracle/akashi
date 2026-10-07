import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BubbleTone = "go" | "agent" | "net" | "white";
export type BubbleTail = "tl" | "bl" | "br" | "tr" | "none";

const TONE: Record<BubbleTone, string> = {
  go: "bubble-go",
  agent: "bubble-agent",
  net: "bubble-net",
  white: "bubble-white card",
};

const TAIL: Record<BubbleTail, string> = {
  tl: "bubble-tail-tl",
  bl: "bubble-tail-bl",
  br: "bubble-tail-br",
  tr: "bubble-tail-tr",
  none: "",
};

/** A speech bubble with a tail (HTTPie's testimonial cards): the AI's claims, the band's slogans, the hero's tag. */
export function Bubble({
  tone = "white",
  tail = "bl",
  className,
  children,
  as: Tag = "div",
}: {
  tone?: BubbleTone;
  tail?: BubbleTail;
  className?: string;
  children: ReactNode;
  as?: "div" | "li" | "span" | "blockquote";
}) {
  return <Tag className={cn("bubble", TONE[tone], TAIL[tail], className)}>{children}</Tag>;
}
