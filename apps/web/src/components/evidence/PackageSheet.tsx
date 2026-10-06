import type { CodeSchemas } from "@akashi/api-client";

import { VerdictStamp } from "./VerdictStamp";

type Package = CodeSchemas["PackageResult"];

/** One package's card: exists or not, and the evidence (placeholder text, the popular name it resembles, its age). */
export function PackageSheet({ result }: { result: Package }) {
  return (
    <article className="card px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerdictStamp word={result.verdict} size="lg" />
        <span className="label">{result.ecosystem}</span>
      </div>
      <h3 className="mt-5 font-mono text-xl font-semibold">
        {result.name}
        {result.latest ? <span className="font-normal text-muted-foreground">@{result.latest}</span> : null}
      </h3>
      {result.description && <p className="mt-2 text-[15px] text-muted-foreground">{result.description}</p>}
      {(result.did_you_mean?.length ?? 0) > 0 && (
        <p className="mt-4 text-[15px]">
          Did you mean <span className="font-mono font-semibold text-link">{result.did_you_mean?.join(", ")}</span>?
        </p>
      )}
      {(result.evidence?.length ?? 0) > 0 && (
        <ul className="mt-4 space-y-1 text-[15px] text-muted-foreground">
          {result.evidence?.map((e) => (
            <li key={e} className="text-pretty">
              {e}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
