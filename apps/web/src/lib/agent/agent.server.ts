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

const ANSWER_NOW = "\n\nThis turn's tool budget is spent. Do not call any tool: answer now from the results above, " +
  "and say plainly what you could not get.";

const toolCalls = (steps: ReadonlyArray<{ toolCalls: readonly unknown[] }>) =>
  steps.reduce((n, step) => n + step.toolCalls.length, 0);

/**
 * Spending the tool budget gets the turn one more step, told to answer, so a turn whose retries used the budget
 * still ends with an answer (stopping at the spend left the last step as tool calls and no text, seen 2026-10-12).
 * That step keeps its tools: switching them off (activeTools: []) makes Groq reject a model that still calls one,
 * "Tool choice is none, but model called a tool" (2026-10-07). The turn stops after it either way.
 */
const answerStepTaken: StopCondition<ToolSet> = ({ steps }) => toolCalls(steps.slice(0, -1)) >= MAX_TOOL_CALLS_PER_TURN;

/** Per message, since the mode decides whether the server or the browser pays for runs. */
export function buildAgent({ model, mode, ip }: { model: LanguageModel; mode: ChatMode; ip?: string }) {
  return new ToolLoopAgent({
    model,
    instructions: AGENT_INSTRUCTIONS,
    tools: buildTools(mode, ip),
    prepareStep: ({ steps }) =>
      toolCalls(steps) >= MAX_TOOL_CALLS_PER_TURN ? { instructions: AGENT_INSTRUCTIONS + ANSWER_NOW } : undefined,
    stopWhen: [isStepCount(MAX_AGENT_STEPS), answerStepTaken],
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
