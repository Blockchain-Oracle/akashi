import "server-only";

import { CHAT_MESSAGES_PER_IP_PER_HOUR, CHAT_WINDOW_S } from "@/lib/constants/agent";

/**
 * The chat's per-IP budget: the same in-memory sliding window as the free demo's (ratelimit.server.ts), in its own
 * bucket so a busy desk does not eat the chat's turns. D-036: in-memory while the web runs as one container.
 */
const MS_PER_S = 1_000;
const WINDOW_MS = CHAT_WINDOW_S * MS_PER_S;
const turns = new Map<string, number[]>();

function recent(ip: string, now: number): number[] {
  const kept = (turns.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (kept.length === 0) turns.delete(ip);
  else turns.set(ip, kept);
  return kept;
}

export function takeChatSlot(ip: string): { ok: true; remaining: number } | { ok: false; retryAfterS: number } {
  const now = Date.now();
  const used = recent(ip, now);
  if (used.length >= CHAT_MESSAGES_PER_IP_PER_HOUR) {
    const oldest = used[0] ?? now;
    return { ok: false, retryAfterS: Math.ceil((oldest + WINDOW_MS - now) / MS_PER_S) };
  }
  used.push(now);
  turns.set(ip, used);
  return { ok: true, remaining: CHAT_MESSAGES_PER_IP_PER_HOUR - used.length };
}

/** What the budget sidebar shows, without taking a slot. */
export function chatBudget(ip: string): { remaining: number; limit: number; window_s: number } {
  const used = recent(ip, Date.now()).length;
  return { remaining: Math.max(0, CHAT_MESSAGES_PER_IP_PER_HOUR - used), limit: CHAT_MESSAGES_PER_IP_PER_HOUR, window_s: CHAT_WINDOW_S };
}
