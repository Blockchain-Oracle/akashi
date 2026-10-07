import "server-only";

import {
  type InferAgentUIMessage,
  type InferUITools,
  isStepCount,
  type LanguageModel,
  type StopCondition,
  ToolLoopAgent,
  type ToolSet,
  type ToolUIPart,
} from "ai";

import { AGENT_INSTRUCTIONS } from "@/lib/agent/instructions";
import { type AkashiTools, buildTools } from "@/lib/agent/tools.server";
import { type ChatMode, MAX_AGENT_STEPS, MAX_TOOL_CALLS_PER_TURN } from "@/lib/constants/agent";

/** Per message, since the mode decides whether the server or the browser pays for runs. */
/**
 * The turn ends when its tool budget is spent. (Switching tools off instead — activeTools: [] — makes Groq reject a
 * model that still calls one: "Tool choice is none, but model called a tool", seen 2026-10-07.)
 */
const toolBudgetSpent: StopCondition<ToolSet> = ({ steps }) =>
  steps.reduce((n, step) => n + step.toolCalls.length, 0) >= MAX_TOOL_CALLS_PER_TURN;

export function buildAgent({ model, mode, ip }: { model: LanguageModel; mode: ChatMode; ip?: string }) {
  return new ToolLoopAgent({
    model,
    instructions: AGENT_INSTRUCTIONS,
    tools: buildTools(mode, ip),
    stopWhen: [isStepCount(MAX_AGENT_STEPS), toolBudgetSpent],
  });
}

export type AkashiAgent = ReturnType<typeof buildAgent>;

/** Set on the assistant message when the stream starts. */
export interface AgentMessageMetadata {
  createdAt: number;
  mode: ChatMode;
  model?: string;
}

export type AgentUIMessage = InferAgentUIMessage<AkashiAgent, AgentMessageMetadata>;
export type AgentToolPart = ToolUIPart<InferUITools<AkashiTools>>;
