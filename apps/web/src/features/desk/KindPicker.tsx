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
          className="rounded-(--radius-chip) border border-border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
