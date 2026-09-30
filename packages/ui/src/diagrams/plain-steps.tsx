import { Seal } from "@akashi/brand/react";
import { Bot, Coins, FileCheck2 } from "lucide-react";

import { cn } from "../cn";

const ICON_STROKE = 1.5;

const STEPS = [
  { Icon: Bot, title: "An AI is about to say something", body: "a source, a piece of code, today's rate" },
  { Icon: Coins, title: "It asks Akashi first", body: "and pays half a cent, like a vending machine" },
  { Icon: null, title: "Akashi looks it up", body: "in the original records, several at once" },
  { Icon: FileCheck2, title: "It gets an answer with proof", body: "a clear verdict and where it was checked" },
] as const;

/** How Akashi works, in four everyday steps. */
export function PlainSteps({ className }: { className?: string }) {
  return (
    <ol className={cn("not-prose grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {STEPS.map((s, i) => (
        <li key={s.title} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            {s.Icon ? <s.Icon className="size-6 text-primary" strokeWidth={ICON_STROKE} /> : <Seal className="size-7" label={null} />}
            <span className="font-mono text-muted-foreground text-xs">{i + 1}</span>
          </div>
          <div className="mt-3 font-medium text-sm">{s.title}</div>
          <p className="mt-1 text-muted-foreground text-xs">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
