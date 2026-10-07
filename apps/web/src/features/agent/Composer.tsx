"use client";

import { ArrowUp, Square } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef } from "react";

import { type ChatMode, MAX_INPUT_CHARS } from "@/lib/constants/agent";
import { cn } from "@/lib/utils";

const MAX_HEIGHT_PX = 220;

/** The prompt box (KeeperHub's composer, simplified): auto-growing text, ⌘/Ctrl+Enter or Enter to send, and how runs are paid. */
export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  busy,
  locked,
  mode,
  onMode,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  locked: string | null;
  mode: ChatMode;
  onMode: (m: ChatMode) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);
  const canSend = value.trim().length > 0 && !busy && !locked;
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };
  return (
    <div className="rounded-lg border border-line bg-background shadow-card focus-within:border-brand">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_INPUT_CHARS))}
        onKeyDown={onKey}
        rows={1}
        placeholder={locked ?? "Ask anything that needs live data…"}
        disabled={Boolean(locked)}
        className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[0.9375rem] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        aria-label="Message the agent"
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-3">
        <div className="inline-flex rounded-md bg-muted p-0.5 text-xs" role="radiogroup" aria-label="Who pays for runs">
          {(["demo", "wallet"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => onMode(m)}
              className={cn("rounded-sm px-2.5 py-1 font-medium", mode === m ? "bg-background text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}
            >
              {m === "demo" ? "Demo credit" : "My wallet"}
            </button>
          ))}
        </div>
        {busy ? (
          <button type="button" onClick={onStop} className="flex size-8 items-center justify-center rounded-md bg-dark text-white" aria-label="Stop">
            <Square className="size-3.5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="flex size-8 items-center justify-center rounded-md bg-brand text-white hover:bg-brand-hover disabled:bg-line-default"
            aria-label="Send"
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
