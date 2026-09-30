"use client";

import { ArrowUp, LoaderCircle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";

import { type DeskMode, MAX_REQUEST_BYTES } from "@/lib/constants/desk";
import { cn } from "@/lib/utils";

import { detect, detectLanguage, parseInstall, splitCitations } from "./detect";
import { ModeTabs } from "./ModeTabs";
import { nowIntent } from "./now-intent";

const MIN_HEIGHT_PX = 96;
const MAX_HEIGHT_PX = 360;
const BYTES_PER_KIB = 1_024;

/** What the desk would do with this text, said before it runs. */
function detected(input: string, mode: DeskMode): string {
  const text = input.trim();
  if (!text) return "waiting for input";
  const service = mode === "auto" ? detect(text) : mode;
  if (service === "cite") {
    const n = splitCitations(text).length;
    return `citation${n === 1 ? "" : `s · ${n}`}`;
  }
  if (service === "code") {
    const pkgs = parseInstall(text);
    return pkgs ? `packages · ${pkgs.map((p) => p.name).join(", ")}` : `code · ${detectLanguage(text)}`;
  }
  return nowIntent(text)?.label.toLowerCase() ?? "question · pick a kind";
}

/** One auto-growing box for anything (the 21st.dev useAutoResizeTextarea pattern, kokonutd 1097). */
export function DeskInput({
  value,
  onChange,
  mode,
  onMode,
  onSubmit,
  running,
}: {
  value: string;
  onChange: (v: string) => void;
  mode: DeskMode;
  onMode: (m: DeskMode) => void;
  onSubmit: () => void;
  running: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const bytes = new TextEncoder().encode(value).length;
  const over = bytes > MAX_REQUEST_BYTES;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = `${MIN_HEIGHT_PX}px`;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_HEIGHT_PX), MAX_HEIGHT_PX)}px`;
  }, [value]);

  useEffect(() => {
    const focus = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card shadow-none transition-colors focus-within:border-primary">
      <label htmlFor="desk-input" className="sr-only">
        Paste a citation, code, or ask a question
      </label>
      <textarea
        id="desk-input"
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (!over && value.trim()) onSubmit();
          }
          if (e.key === "Escape") onChange("");
        }}
        placeholder="Paste a citation, code, or ask about today…"
        spellCheck={false}
        className="block w-full resize-none rounded-t-lg bg-transparent px-5 pt-4 pb-2 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      />
      <div className="flex flex-wrap items-center gap-2 border-border border-t px-3 py-2">
        <ModeTabs value={mode} onChange={onMode} />
        <span className="truncate font-mono text-muted-foreground text-xs" aria-live="polite">
          {detected(value, mode)}
        </span>
        <span className={cn("ml-auto font-mono text-xs tabular-nums", over ? "text-verdict-not-found" : "text-muted-foreground")}>
          {(bytes / BYTES_PER_KIB).toFixed(1)} / 64 KiB
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={running || over || !value.trim()}
          aria-label="Check (⌘ Enter)"
          className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          {running ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
