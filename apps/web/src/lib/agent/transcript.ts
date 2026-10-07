/**
 * Pure helpers over stored UI messages (no server-only: the client reuses textOf). The server keeps the transcript and
 * the browser sends one message at a time (D-038), so merging and trimming happen here, before a write.
 */
import { isToolUIPart, type UIMessage } from "ai";

type Part = UIMessage["parts"][number];

const TRIMMED_OUTPUT = { trimmed: true } as const;
const encoder = new TextEncoder();

/** The text parts of a message joined, for limits and titles. */
export function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<Part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** A tool part may only advance from awaiting its output to having one; everything else about it must be unchanged. */
function toolPartAdvances(stored: Part, incoming: Part): boolean {
  if (!isToolUIPart(stored) || !isToolUIPart(incoming)) return false;
  if (stored.type !== incoming.type || stored.toolCallId !== incoming.toolCallId) return false;
  if (stored.state === incoming.state) return same(stored, incoming);
  const finished = incoming.state === "output-available" || incoming.state === "output-error";
  return stored.state === "input-available" && finished && same(stored.input, incoming.input);
}

/**
 * Pay mode: the browser performed the paid calls and sends the assistant message back with the outputs filled in.
 * Accept it only when it is the stored last assistant message with the same tool calls, otherwise null.
 */
export function mergeContinuation(stored: UIMessage[], incoming: UIMessage): UIMessage[] | null {
  const last = stored.at(-1);
  if (!last || last.role !== "assistant" || incoming.role !== "assistant" || last.id !== incoming.id) return null;
  if (last.parts.length !== incoming.parts.length) return null;
  for (const [index, part] of last.parts.entries()) {
    const next = incoming.parts[index];
    if (!next) return null;
    if (isToolUIPart(part) || isToolUIPart(next)) {
      if (!toolPartAdvances(part, next)) return null;
    } else if (!same(part, next)) {
      return null;
    }
  }
  return [...stored.slice(0, -1), incoming];
}

const bytesOf = (value: unknown): number => encoder.encode(JSON.stringify(value)).length;

function withTrimmedOutputs(message: UIMessage): UIMessage {
  return {
    ...message,
    parts: message.parts.map((part) =>
      isToolUIPart(part) && part.state === "output-available" && !same(part.output, TRIMMED_OUTPUT)
        ? { ...part, output: TRIMMED_OUTPUT }
        : part,
    ),
  };
}

/**
 * Keep the transcript under maxBytes: first replace the oldest tool outputs with `{ trimmed: true }` (the verdict text
 * around them survives), then drop the oldest messages. The newest message is never touched, and the list is kept
 * starting at a user message so the model sees a well-formed conversation.
 */
export function trimTranscript(messages: UIMessage[], maxBytes: number): UIMessage[] {
  const out = [...messages];
  let total = bytesOf(out);
  for (let i = 0; i < out.length - 1 && total > maxBytes; i++) {
    const current = out[i];
    if (!current) continue;
    const trimmed = withTrimmedOutputs(current);
    if (trimmed !== current && !same(trimmed, current)) {
      total += bytesOf(trimmed) - bytesOf(current);
      out[i] = trimmed;
    }
  }
  while (out.length > 1 && total > maxBytes) {
    const dropped = out.shift();
    total -= dropped ? bytesOf(dropped) : 0;
    while (out.length > 1 && out[0]?.role !== "user") {
      const lead = out.shift();
      total -= lead ? bytesOf(lead) : 0;
    }
  }
  return out;
}
