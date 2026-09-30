"use client";

import { useCallback, useRef, useState } from "react";

import type { DeskMode, DeskService } from "@/lib/constants/desk";

export interface DeskItem {
  index: number;
  label: string;
  status: "pending" | "done" | "error";
  body?: unknown;
  ms?: number;
}

export interface DeskError {
  code: string;
  message: string;
  retry_after_s?: number;
}

export interface DeskState {
  phase: "idle" | "running" | "done" | "error";
  input: string;
  service?: DeskService;
  items: DeskItem[];
  error?: DeskError;
  elapsedMs?: number;
}

type Line =
  | { type: "route"; service: DeskService; labels: string[] }
  | { type: "item"; index: number; ok: boolean; status: number; body: unknown }
  | { type: "done"; elapsed_ms: number };

const IDLE: DeskState = { phase: "idle", input: "", items: [] };

/** Runs one desk check and folds the NDJSON stream into state as each item resolves. */
export function useDesk() {
  const [state, setState] = useState<DeskState>(IDLE);
  const abort = useRef<AbortController | null>(null);

  const run = useCallback(async (input: string, mode: DeskMode) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const started = performance.now();
    setState({ phase: "running", input, items: [] });
    try {
      const res = await fetch("/api/desk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, mode }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: DeskError } | null;
        setState({ phase: "error", input, items: [], error: body?.error ?? { code: "unavailable", message: "The desk did not answer." } });
        return;
      }
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          const line = JSON.parse(raw) as Line;
          setState((s) => apply(s, line, performance.now() - started));
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ phase: "error", input, items: [], error: { code: "network", message: "Could not reach the desk." } });
    }
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setState(IDLE);
  }, []);

  return { state, run, reset };
}

function apply(s: DeskState, line: Line, ms: number): DeskState {
  if (line.type === "route") {
    return { ...s, service: line.service, items: line.labels.map((label, index) => ({ index, label, status: "pending" })) };
  }
  if (line.type === "item") {
    return {
      ...s,
      items: s.items.map((it) =>
        it.index === line.index ? { ...it, status: line.ok ? "done" : "error", body: line.body, ms: Math.round(ms) } : it,
      ),
    };
  }
  return { ...s, phase: "done", elapsedMs: line.elapsed_ms };
}
