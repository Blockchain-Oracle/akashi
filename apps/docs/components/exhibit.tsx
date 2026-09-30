import type { VerdictTone } from "@akashi/brand";

/**
 * A captured, real response shown as evidence: a mono caption (the request, and the outcome in its verdict colour)
 * above the code block.
 */
export function Exhibit({
  request,
  result,
  tone,
  children,
}: {
  request: string;
  result: string;
  tone: VerdictTone;
  children: React.ReactNode;
}) {
  return (
    <figure className="exhibit not-prose">
      <figcaption className="exhibit-caption">
        <span>{request}</span>
        <span className="exhibit-result" data-tone={tone}>
          {result}
        </span>
      </figcaption>
      <div className="exhibit-body">{children}</div>
    </figure>
  );
}
