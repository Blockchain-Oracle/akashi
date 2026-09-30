import { cn } from "@/lib/cn";

function Layer({
  title,
  who,
  fields,
  tone,
  children,
}: {
  title: string;
  who: string;
  fields: [string, string][];
  tone: "portal" | "akashi" | "item";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 md:p-5",
        tone === "portal" && "border-fd-border bg-fd-background",
        tone === "akashi" && "border-fd-primary/60 bg-fd-primary/5",
        tone === "item" && "border-fd-border bg-fd-card",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <code className="font-mono font-medium text-sm">{title}</code>
        <span className="font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.14em]">{who}</span>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
        {fields.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 font-mono text-fd-foreground">{k}</dt>
            <dd className="text-fd-muted-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
    </div>
  );
}

/** What an agent receives: the portal's wrapper, Akashi's envelope inside it, one typed result per input. */
export function EnvelopeAnatomy({ className }: { className?: string }) {
  return (
    <figure className={cn("not-prose rounded-3xl border border-fd-border bg-fd-card p-3 md:p-5", className)}>
      <Layer
        title="{ portal, data }"
        who="written by the portal"
        tone="portal"
        fields={[
          ["portal.provenance", "third-party-supplier"],
          ["portal.serviceId", "citation-verify"],
          ["portal.schemaCheck", "passed"],
          ["data", "Akashi's answer, verbatim"],
        ]}
      >
        <Layer
          title="data"
          who="written by Akashi"
          tone="akashi"
          fields={[
            ["status", "complete | partial"],
            ["as_of", "when it was assembled"],
            ["elapsed_ms", "time taken"],
            ["unavailable", "sources that failed"],
            ["summary", "count per verdict"],
            ["sources", "every upstream asked"],
          ]}
        >
          <Layer
            title="results[i]"
            who="one per input"
            tone="item"
            fields={[
              ["verdict", "a fixed word"],
              ["reasons", "why"],
              ["matched", "the record found"],
              ["retryable", "worth asking again?"],
            ]}
          />
        </Layer>
      </Layer>
    </figure>
  );
}
