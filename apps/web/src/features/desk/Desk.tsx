"use client";

import { useState } from "react";

import { Blob } from "@/components/ui/blob";
import type { DeskMode, Exhibit } from "@/lib/constants/desk";
import { SECONDS_PER_MINUTE } from "@/lib/constants/ui";

import { DeskInput } from "./DeskInput";
import { Exhibits } from "./Exhibits";
import { KindPicker } from "./KindPicker";
import { Readout } from "./Readout";
import { Results } from "./Results";
import { useDesk } from "./useDesk";

/**
 * The Evidence desk: the hero's product window (a terminal over HTTPie's blobs), routed to the right check; the
 * readout and the evidence land below at full width.
 */
export function Desk() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<DeskMode>("auto");
  const { state, run } = useDesk();
  const running = state.phase === "running";

  const submit = (text = input) => {
    if (text.trim()) void run(text, mode);
  };

  const pick = (exhibit: Exhibit) => {
    setInput(exhibit.input);
    setMode("auto");
    submit(exhibit.input);
  };

  return (
    <div className="space-y-8">
      <div className="relative isolate mx-auto max-w-4xl">
        <Blob tone="go" className="-top-12 -left-16 h-56 w-72 sm:-left-28 sm:h-72 sm:w-96" />
        <Blob tone="agent" className="-right-8 -bottom-10 h-28 w-36 sm:-right-20 sm:h-40 sm:w-52" />
        <Blob tone="band" className="-right-28 top-6 hidden h-64 w-64 md:block" />
        <DeskInput value={input} onChange={setInput} mode={mode} onMode={setMode} onSubmit={() => submit()} running={running} />
        <Exhibits onPick={pick} className="mt-5" />
      </div>

      {state.phase === "error" && state.error && (
        <div role="alert" className="card mx-auto max-w-4xl border-l-4 border-l-warn px-5 py-4 text-[15px]">
          {state.error.code !== "needs_kind" && <div className="label">{state.error.code}</div>}
          <p className={state.error.code === "needs_kind" ? undefined : "mt-1"}>{state.error.message}</p>
          {state.error.code === "needs_kind" && <KindPicker disabled={running} onPick={(kind) => void run(state.input, "now", kind)} />}
          {state.error.retry_after_s !== undefined && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">Try again in {Math.ceil(state.error.retry_after_s / SECONDS_PER_MINUTE)} min.</p>
          )}
        </div>
      )}

      {state.service && (
        <div className="space-y-5">
          <Readout state={state} />
          <Results state={state} />
        </div>
      )}
    </div>
  );
}
