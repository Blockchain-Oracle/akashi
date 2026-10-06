"use client";

import { KIND_LABELS, PICKABLE_KINDS, type PickableKind } from "./now-intent";

/** For a question the router could not place: pick what it is about, and the question's subject is sent as that. */
export function KindPicker({ onPick, disabled }: { onPick: (kind: PickableKind) => void; disabled?: boolean }) {
  return (
    <div role="group" aria-label="What is the question about?" className="mt-3 flex flex-wrap gap-2">
      {PICKABLE_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          disabled={disabled}
          onClick={() => onPick(kind)}
          className="rounded-chip border border-border-2 bg-card px-3 py-1.5 text-sm font-medium transition-colors duration-(--duration-fast) hover:border-foreground disabled:opacity-50"
        >
          {KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
