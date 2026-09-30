"use client";

import { useState } from "react";

import type { DeskMode } from "@/lib/constants/desk";
import { SECONDS_PER_MINUTE } from "@/lib/constants/ui";

import { DeskInput } from "./DeskInput";
import { ExampleChips } from "./ExampleChips";
import { Results } from "./Results";
import { Trace } from "./Trace";
import { useDesk } from "./useDesk";

/** The Evidence desk: one box for anything, routed to the right check, evidence streamed back. */
export function Desk() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<DeskMode>("auto");
  const { state, run } = useDesk();
  const running = state.phase === "running";

  const submit = (text = input) => {
    if (text.trim()) void run(text, mode);
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <DeskInput value={input} onChange={setInput} mode={mode} onMode={setMode} onSubmit={() => submit()} running={running} />
        <ExampleChips
          onPick={(text) => {
            setInput(text);
            setMode("auto");
            submit(text);
          }}
        />
      </div>

      {state.phase === "error" && state.error && (
        <div role="alert" className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-4 text-sm">
          <span className="font-mono text-muted-foreground text-xs">{state.error.code}</span>
          <p className="mt-1">{state.error.message}</p>
          {state.error.retry_after_s !== undefined && (
            <p className="mt-1 text-muted-foreground text-xs">Try again in {Math.ceil(state.error.retry_after_s / SECONDS_PER_MINUTE)} min.</p>
          )}
        </div>
      )}

      {state.service && (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Trace state={state} />
          </div>
          <Results state={state} />
        </div>
      )}
    </div>
  );
}
