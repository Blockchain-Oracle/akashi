import { isToolUIPart, type UIMessage } from "ai";

import type { RunOutput } from "@/lib/agent/schemas";

type Part = UIMessage["parts"][number];

export type ToolName = "find_tools" | "inspect_tool" | "run_tool";

export interface ToolPart {
  type: `tool-${ToolName}`;
  toolCallId: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error" | string;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
}

export function asToolPart(part: Part): ToolPart | null {
  return isToolUIPart(part) ? (part as unknown as ToolPart) : null;
}

export const toolName = (part: ToolPart): ToolName => part.type.slice("tool-".length) as ToolName;

export const isRunning = (part: ToolPart): boolean => part.state === "input-streaming" || part.state === "input-available";

/** A run_tool part waiting for the visitor to pay (wallet mode: the server did not execute it). */
export const awaitsPayment = (part: ToolPart, mode: "demo" | "wallet"): boolean =>
  toolName(part) === "run_tool" && part.state === "input-available" && mode === "wallet";

export function runOutput(part: ToolPart): Exclude<RunOutput, { trimmed: true }> | null {
  const output = part.output as RunOutput | undefined;
  if (!output || "trimmed" in output) return null;
  return output;
}

/** The last assistant message still holds a run awaiting payment: sending a new message must wait. */
export function pendingPayment(messages: UIMessage[], mode: "demo" | "wallet"): boolean {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant") return false;
  return last.parts.some((p) => {
    const tp = asToolPart(p);
    return tp !== null && awaitsPayment(tp, mode);
  });
}
