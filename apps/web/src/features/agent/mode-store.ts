import { type ChatMode, DEFAULT_CHAT_MODE } from "@/lib/constants/agent";

/**
 * Who pays for runs, remembered per browser. A tiny external store (useSyncExternalStore): the server renders the
 * default, the browser reads localStorage after hydration, and the chat transport reads `currentMode()` when it
 * sends — including the automatic sends that resume a turn after a payment.
 */
const KEY = "akashi-chat-mode";
const listeners = new Set<() => void>();
let mode: ChatMode = DEFAULT_CHAT_MODE;
let loaded = false;

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "demo" || saved === "wallet") mode = saved;
  } catch {
    // storage blocked: keep the default
  }
}

export function currentMode(): ChatMode {
  load();
  return mode;
}

export function setMode(next: ChatMode): void {
  mode = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  for (const listener of listeners) listener();
}

export function subscribeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const serverMode = (): ChatMode => DEFAULT_CHAT_MODE;
