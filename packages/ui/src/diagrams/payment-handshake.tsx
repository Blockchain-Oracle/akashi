"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "../cn";

const STEP_MS = 1_600;

type Dir = "right" | "left";
const MESSAGES: { dir: Dir; label: string; detail: string }[] = [
  { dir: "right", label: "POST /v1/live-facts/v1/fx", detail: "no payment yet" },
  { dir: "left", label: "402 Payment Required", detail: "amount 5000 · USDC · Base" },
  { dir: "right", label: "POST again + PAYMENT-SIGNATURE", detail: "a signed USDC authorization" },
  { dir: "left", label: "200 { portal, data }", detail: "PAYMENT-RESPONSE: the settlement tx" },
];

/** The x402 handshake between an agent and the portal: the price first, then the paid call. */
export function PaymentHandshake({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? MESSAGES.length : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % (MESSAGES.length + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <figure className={cn("not-prose rounded-3xl border border-border bg-card p-5 md:p-8", className)}>
      <div className="flex justify-between font-medium text-sm">
        <span>Agent</span>
        <span>Agentic Portal</span>
      </div>
      <div className="relative mt-3 space-y-3 border-border border-x px-3 py-2">
        {MESSAGES.map((m, i) => (
          <div
            key={m.label}
            className={cn("transition-opacity duration-300", i < step ? "opacity-100" : "opacity-15")}
          >
            <div className={cn("flex items-center gap-2", m.dir === "left" && "flex-row-reverse")}>
              <span className={cn("h-px flex-1", m.dir === "right" ? "bg-primary" : "bg-verdict-verified")} />
              <span className={cn("text-xs", m.dir === "right" ? "text-primary" : "text-verdict-verified")}>
                {m.dir === "right" ? "▶" : "◀"}
              </span>
            </div>
            <div className={cn("mt-1 font-mono text-xs", m.dir === "left" && "text-right")}>
              <span className="text-foreground">{m.label}</span>
              <span className="text-muted-foreground"> · {m.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
