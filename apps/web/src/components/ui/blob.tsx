import { cn } from "@/lib/utils";

export type BlobTone = "go" | "agent" | "band";

const TONE: Record<BlobTone, string> = { go: "blob-go", agent: "blob-agent", band: "blob-band" };

/** A flat organic shape behind a window (HTTPie's blobs). Place inside a `relative isolate` box; size with classes. */
export function Blob({ tone, className }: { tone: BlobTone; className?: string }) {
  return <span aria-hidden className={cn("blob", TONE[tone], className)} />;
}
