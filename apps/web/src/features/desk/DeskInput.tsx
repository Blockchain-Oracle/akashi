"use client";

import { Seal } from "@akashi/brand/react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";

import { type DeskMode, MAX_REQUEST_BYTES } from "@/lib/constants/desk";
import { ICON_STROKE } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";

import { detect, detectLanguage, parseInstall, splitCitations } from "./detect";
import { ModeTabs } from "./ModeTabs";
import { nowIntent } from "./now-intent";

const MIN_HEIGHT_PX = 128;
const MAX_HEIGHT_PX = 420;
const BYTES_PER_KIB = 1_024;
const KIB_DECIMALS = 1;
const MAX_KIB = MAX_REQUEST_BYTES / BYTES_PER_KIB;

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

/**
 * The desk as a code card (Val Town's editor card): a header bar, one auto-growing box for anything (the 21st.dev
 * useAutoResizeTextarea pattern, kokonutd 1097), and a footer strip with the mode tabs and the lemon Check button.
 */
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
  const ready = !running && !over && value.trim().length > 0;

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
    <div className="desk-card card overflow-hidden shadow-3">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-band px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
          <Seal className="size-4 shrink-0" label={null} />
          <span className="truncate">desk · paste a citation, code, or a question about today</span>
        </span>
        <span className={cn("shrink-0 font-mono text-xs tabular-nums", over ? "text-verdict-not-found" : "text-muted-foreground")}>
          {(bytes / BYTES_PER_KIB).toFixed(KIB_DECIMALS)} / {MAX_KIB} KiB
        </span>
      </div>
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
            if (ready) onSubmit();
          }
          if (e.key === "Escape") onChange("");
        }}
        placeholder="Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019)"
        spellCheck={false}
        className="block w-full resize-none bg-card px-5 py-5 text-[17px] leading-relaxed text-foreground placeholder:text-faint-foreground focus-visible:outline-none sm:px-6"
      />
      <div className={cn("flex flex-wrap items-center gap-3 border-t border-border bg-card px-3 py-2.5", running && "sweep")}>
        <ModeTabs value={mode} onChange={onMode} />
        <span className="truncate font-mono text-xs text-muted-foreground" aria-live="polite">
          {detected(value, mode)}
        </span>
        <kbd className="ml-auto hidden rounded-(--radius-sm) border border-border-2 bg-band px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline-block">
          ⌘ ↵
        </kbd>
        <button type="button" onClick={onSubmit} disabled={!ready} className="btn btn-marker px-4 py-2 text-sm disabled:opacity-50 disabled:shadow-none">
          {running ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          {running ? "Checking" : "Check"}
          {!running && <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
