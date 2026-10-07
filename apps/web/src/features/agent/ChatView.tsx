"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import type { RunResult } from "@/lib/agent/schemas";
import type { ChatMode } from "@/lib/constants/agent";

import { ChatHome } from "./ChatHome";
import { currentMode } from "./mode-store";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { pendingPayment } from "./parts";

/**
 * One conversation. The server owns the transcript, so the transport sends only `{ id, message, mode }`; the first
 * send creates the chat. In wallet mode a run waits for the pay card: once the visitor pays (or cancels), the
 * output is added and the turn resumes on its own.
 */
export function ChatView({
  chatId,
  initialMessages,
  created,
  mode,
  onMode,
  onCreated,
  onTurnFinished,
  toolCount,
  initialInput = "",
}: {
  chatId: string;
  initialMessages: UIMessage[];
  created: boolean;
  mode: ChatMode;
  onMode: (m: ChatMode) => void;
  onCreated: (id: string) => void;
  onTurnFinished: () => void;
  toolCount: number;
  /** Text to start the composer with, e.g. from a tool page's "Try it in the agent". */
  initialInput?: string;
}) {
  const createdRef = useRef(created);
  const [input, setInput] = useState(initialInput);
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: { id, message: messages[messages.length - 1], mode: currentMode() },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, addToolOutput, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: () => onTurnFinished(),
  });

  const busy = status === "submitted" || status === "streaming";
  const awaitingPay = pendingPayment(messages, mode);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const ensureChat = async (): Promise<boolean> => {
    if (createdRef.current) return true;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: chatId }),
    });
    if (!res.ok) {
      setNotice("Could not start a chat. Reload and try again.");
      return false;
    }
    createdRef.current = true;
    onCreated(chatId);
    return true;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || awaitingPay) return;
    setNotice(null);
    if (!(await ensureChat())) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  const onPaid = (toolCallId: string, output: RunResult) => {
    void addToolOutput({ tool: "run_tool", toolCallId, output });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-4 py-8">
          {messages.length === 0 ? (
            <ChatHome onPick={(prompt) => void send(prompt)} toolCount={toolCount} />
          ) : (
            <MessageList messages={messages} live={busy} mode={mode} onPaid={onPaid} />
          )}
          {error && (
            <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error.message.includes("model_unavailable")
                ? "The chat has no model key on this server yet."
                : error.message.includes("rate")
                  ? "The model is rate limited for a moment (free tier). Try again in a minute."
                  : `The agent hit an error: ${error.message}`}
            </p>
          )}
          {notice && <p className="mt-6 text-sm text-destructive">{notice}</p>}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="border-t border-line bg-background/90 backdrop-blur">
        <div className="mx-auto w-full max-w-[760px] px-4 py-4">
          <Composer
            value={input}
            onChange={setInput}
            onSend={() => void send(input)}
            onStop={() => void stop()}
            busy={busy}
            locked={awaitingPay ? "Pay or cancel the run above to continue…" : null}
            mode={mode}
            onMode={onMode}
          />
          <p className="mt-2 text-center font-mono text-[0.6875rem] text-muted-foreground">
            {mode === "demo"
              ? "Demo credit: Akashi's testnet wallet pays for your runs (capped per day)."
              : "My wallet: every run asks for your signature; Base Sepolia test USDC, no ETH needed."}
          </p>
        </div>
      </div>
    </div>
  );
}
