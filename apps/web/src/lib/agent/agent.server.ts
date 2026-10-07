import "server-only";

import { type InferAgentUIMessage, type InferUITools, isStepCount, type LanguageModel, ToolLoopAgent, type ToolUIPart } from "ai";

import { AGENT_INSTRUCTIONS } from "@/lib/agent/instructions";
import { type AkashiTools, buildTools } from "@/lib/agent/tools.server";
import { type ChatMode, MAX_AGENT_STEPS, MAX_TOOL_CALLS_PER_TURN } from "@/lib/constants/agent";

/** Per message, since the mode decides whether the server or the browser performs the calls. */
export function buildAgent({ model, mode }: { model: LanguageModel; mode: ChatMode }) {
  return new ToolLoopAgent({
    model,
    instructions: AGENT_INSTRUCTIONS,
    tools: buildTools(mode),
    stopWhen: isStepCount(MAX_AGENT_STEPS),
    // Once a turn has spent its tool budget the model must answer from what it has: no tools on the next steps.
    prepareStep: ({ steps }) => {
      const calls = steps.reduce((n, step) => n + step.toolCalls.length, 0);
      return calls >= MAX_TOOL_CALLS_PER_TURN ? { activeTools: [] } : {};
    },
  });
}

export type AkashiAgent = ReturnType<typeof buildAgent>;

/** Set on the assistant message when the stream starts (specs/web.md §7, "Message metadata"). */
export interface AgentMessageMetadata {
  createdAt: number;
  mode: ChatMode;
  model?: string;
}

export type AgentUIMessage = InferAgentUIMessage<AkashiAgent, AgentMessageMetadata>;
export type AgentToolPart = ToolUIPart<InferUITools<AkashiTools>>;
