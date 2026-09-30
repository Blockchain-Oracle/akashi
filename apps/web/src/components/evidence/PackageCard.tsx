import type { CodeSchemas } from "@akashi/api-client";

import { VerdictSeal } from "./VerdictSeal";

type Package = CodeSchemas["PackageResult"];

/** One package: exists or not, and the evidence (placeholder text, the popular name it resembles, its age). */
export function PackageCard({ result }: { result: Package }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerdictSeal word={result.verdict} size="lg" />
        <span className="font-mono text-muted-foreground text-xs">{result.ecosystem}</span>
      </div>
      <h3 className="mt-4 font-mono text-lg">
        {result.name}
        {result.latest ? <span className="text-muted-foreground">@{result.latest}</span> : null}
      </h3>
      {result.description && <p className="mt-1 text-muted-foreground text-sm">{result.description}</p>}
      {(result.did_you_mean?.length ?? 0) > 0 && (
        <p className="mt-3 text-sm">
          Did you mean <span className="font-mono text-primary">{result.did_you_mean?.join(", ")}</span>?
        </p>
      )}
      {(result.evidence?.length ?? 0) > 0 && (
        <ul className="mt-3 space-y-1 text-muted-foreground text-sm">
          {result.evidence?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
