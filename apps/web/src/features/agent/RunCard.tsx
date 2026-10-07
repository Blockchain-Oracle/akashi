"use client";

import type { RunResult } from "@/lib/agent/schemas";

import { ReceiptCard } from "./ReceiptCard";
import { ErrorCard, ResultCard } from "./results";

const HTTP_ERROR_MIN = 400;

/** A finished run: the tool's answer as its render-kind card (or the error), then its receipt. */
export function RunCard({ output }: { output: RunResult }) {
  const body = (output.body ?? {}) as { error?: unknown; found?: boolean };
  // A "found nothing" answer comes back as an envelope (found: false, HTTP 404), not an error: the result card shows it.
  const failed = body.error !== undefined || (output.status >= HTTP_ERROR_MIN && body.found !== false);
  const error = body.error ?? { code: `http_${output.status}`, message: "The run did not complete.", retryable: false };
  return (
    <div className="flex w-full flex-col gap-2.5">
      {failed ? <ErrorCard status={output.status} error={error} note={output.receipt.note} /> : <ResultCard envelope={output.body} />}
      <ReceiptCard receipt={output.receipt} endpointId={output.id} latencyMs={output.latency_ms} />
    </div>
  );
}
