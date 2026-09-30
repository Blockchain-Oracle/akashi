import "server-only";

/**
 * The free demo's per-IP budget: a sliding window kept in memory (one web container). Pay via Pocket has no limit;
 * a Redis-backed limiter replaces this when the web scales past one instance.
 */
const MS_PER_S = 1_000;
const hits = new Map<string, number[]>();

export function takeDemoSlot(ip: string, limit: number, windowS: number): { ok: true } | { ok: false; retryAfterS: number } {
  const now = Date.now();
  const since = now - windowS * MS_PER_S;
  const recent = (hits.get(ip) ?? []).filter((t) => t > since);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfterS: Math.ceil((oldest + windowS * MS_PER_S - now) / MS_PER_S) };
  }
  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
