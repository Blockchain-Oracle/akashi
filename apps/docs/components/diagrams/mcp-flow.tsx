import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/cn";

const TOOLS = [
  { name: "search_services", cost: "free", does: "finds citation-verify, code-reality-check, live-facts" },
  { name: "describe_service", cost: "free", does: "reads the paths and schemas from the service card" },
  { name: "call_service", cost: "$0.005", does: "pays and returns { portal, data }" },
] as const;

/** An agent in Claude or Cursor reaching Akashi through Pocket's MCP server: three tools, one paid. */
export function McpFlow({ className }: { className?: string }) {
  return (
    <figure className={cn("not-prose grid gap-3 rounded-3xl border border-fd-border bg-fd-card p-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:p-8", className)}>
      {TOOLS.map((t, i) => (
        <div key={t.name} className="contents">
          <div className={cn("rounded-2xl border p-4", t.cost === "free" ? "border-fd-border bg-fd-background" : "border-fd-primary/60 bg-fd-primary/5")}>
            <div className="flex items-baseline justify-between gap-2">
              <code className="font-mono text-sm">{t.name}</code>
              <span className={cn("font-mono text-xs", t.cost === "free" ? "text-fd-muted-foreground" : "text-fd-primary")}>{t.cost}</span>
            </div>
            <p className="mt-2 text-fd-muted-foreground text-xs">{t.does}</p>
          </div>
          {i < TOOLS.length - 1 && <ArrowRight className="mx-auto size-4 rotate-90 self-center text-fd-muted-foreground md:rotate-0" aria-hidden />}
        </div>
      ))}
    </figure>
  );
}
