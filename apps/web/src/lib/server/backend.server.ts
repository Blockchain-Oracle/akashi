import "server-only";

import { SERVICES } from "@akashi/brand";

import { BACKEND_MARGIN_MS, type DeskService } from "@/lib/constants/desk";
import { DEADLINE_MS } from "@/lib/constants/services";
import { serverEnv } from "@/lib/server/env.server";

export type BackendResult = { ok: true; status: number; body: unknown } | { ok: false; status: number; body: unknown };

/** One POST to the Akashi API on the internal network, bounded by the service's hard stop plus the hop. */
export async function callBackend(service: DeskService, path: string, body: unknown): Promise<BackendResult> {
  const url = `${serverEnv().AKASHI_API_URL}${SERVICES[service].prefix}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEADLINE_MS[service] + BACKEND_MARGIN_MS),
      cache: "no-store",
    });
    const json: unknown = await res.json().catch(() => ({ error: { code: "internal", message: "Not JSON", retryable: true } }));
    return { ok: res.ok, status: res.status, body: json };
  } catch {
    return { ok: false, status: 0, body: { error: { code: "unavailable", message: "Akashi did not answer in time.", retryable: true } } };
  }
}
