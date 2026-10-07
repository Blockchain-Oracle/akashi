/** Forwarding. Paid runs go through pocket-ap (a signed Pocket relay to Akashi's supplier); reads go direct. */

import type { GatewayConfig } from "./config.js";
import { HTTP_SERVER_ERROR_MIN, READ_FORWARD_TIMEOUT_MS, RUN_FORWARD_TIMEOUT_MS } from "./constants.js";

export type Via = "pocket" | "direct";

export interface Forwarded {
  status: number;
  body: string;
  via: Via;
  contentType: string;
}

const JSON_HEADERS = { "content-type": "application/json", accept: "application/json" };

async function post(url: string, body: string, timeoutMs: number): Promise<Response> {
  return fetch(url, { method: "POST", headers: JSON_HEADERS, body, signal: AbortSignal.timeout(timeoutMs) });
}

async function read(res: Response, via: Via): Promise<Forwarded> {
  return {
    status: res.status,
    body: await res.text(),
    via,
    contentType: res.headers.get("content-type") ?? "application/json",
  };
}

/**
 * A relay-layer failure (pocket-ap down, no session, supplier unreachable) answers 5xx or throws before the
 * backend runs. Only then may we go direct; a backend 5xx that came back through the relay is a real answer.
 */
function relayLayerFailed(res: Response): boolean {
  return res.status >= HTTP_SERVER_ERROR_MIN && !res.headers.get("content-type")?.includes("application/json");
}

export async function forwardRun(config: GatewayConfig, path: string, body: string): Promise<Forwarded> {
  if (config.pocketApUrl) {
    try {
      const res = await post(`${config.pocketApUrl}${path}`, body, RUN_FORWARD_TIMEOUT_MS);
      if (!relayLayerFailed(res) || !config.directFallback) return read(res, "pocket");
      console.warn(JSON.stringify({ event: "relay_layer_failed", status: res.status, path }));
    } catch (error) {
      if (!config.directFallback) throw error;
      console.warn(JSON.stringify({ event: "relay_unreachable", path, error: String(error) }));
    }
  }
  return read(await post(`${config.apiUrl}${path}`, body, RUN_FORWARD_TIMEOUT_MS), "direct");
}

export async function forwardRead(config: GatewayConfig, method: "GET" | "POST", path: string,
                                  body?: string): Promise<Forwarded> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: method === "POST" ? JSON_HEADERS : { accept: "application/json" },
    body: method === "POST" ? body : undefined,
    signal: AbortSignal.timeout(READ_FORWARD_TIMEOUT_MS),
  });
  return read(res, "direct");
}
