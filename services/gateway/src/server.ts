/**
 * akashi-gateway: the public front door (api.<domain>).
 *   free   GET  /v1/catalog · POST /v1/discover · POST /v1/inspect · GET /v1/endpoints/:p/:s · /.well-known/x402
 *   paid   POST /v1/run/:provider/:slug  — x402 exact payment, relayed over Pocket, settled only on success
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";

import { loadCatalog } from "./catalog.js";
import type { Catalog } from "./catalog.js";
import { readConfig } from "./config.js";
import {
  CATALOG_REFRESH_MS,
  ENDPOINT_HEADER,
  EXPOSED_HEADERS,
  HTTP_BAD_GATEWAY,
  HTTP_BAD_REQUEST,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_PAYLOAD_TOO_LARGE,
  MAX_BODY_BYTES,
  RUN_PREFIX,
  SERVICE_ID,
  VIA_HEADER,
} from "./constants.js";
import { mcpHandler } from "./mcp.js";
import { paymentLayer } from "./payments.js";
import { forwardRead, forwardRun } from "./relay.js";
import type { Forwarded } from "./relay.js";

const config = readConfig();
let catalog: Catalog = await loadCatalog(config.apiUrl);
let endpointsByPath = new Map(catalog.endpoints.filter((e) => e.available).map((e) => [e.path, e]));
let payments = paymentLayer(catalog, config);

/** A new api deploy can add, remove or reprice tools: swap the catalog and the paid route table atomically. */
async function refreshCatalog(): Promise<void> {
  try {
    const next = await loadCatalog(config.apiUrl, 1);
    if (next.hash === catalog.hash) return;
    catalog = next;
    endpointsByPath = new Map(next.endpoints.filter((e) => e.available).map((e) => [e.path, e]));
    payments = paymentLayer(next, config);
    console.log(JSON.stringify({ event: "catalog_reloaded", hash: next.hash, endpoints: endpointsByPath.size }));
  } catch (error) {
    console.warn(JSON.stringify({ event: "catalog_refresh_failed", error: String(error) }));
  }
}
setInterval(() => void refreshCatalog(), CATALOG_REFRESH_MS).unref();

type ErrorStatus = 400 | 404 | 413 | 502;

function jsonError(c: Context, status: ErrorStatus, code: string, message: string, details: string[] = []) {
  return c.json({ error: { code, message, retryable: status === HTTP_BAD_GATEWAY, details } }, status);
}

function relay(c: Context, forwarded: Forwarded) {
  return new Response(forwarded.body, {
    status: forwarded.status,
    headers: { "content-type": forwarded.contentType, [VIA_HEADER]: forwarded.via },
  });
}

const app = new Hono();

app.use("*", cors({ origin: config.corsOrigins, exposeHeaders: EXPOSED_HEADERS, maxAge: 600 }));

app.use("*", async (c, next) => {
  const declared = Number(c.req.header("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return jsonError(c, HTTP_PAYLOAD_TOO_LARGE, "payload_too_large", "Request body exceeds 64 KiB.");
  }
  await next();
});

const identity = () => ({
  service: SERVICE_ID,
  gateway: "akashi-gateway",
  catalog: catalog.hash,
  endpoints: endpointsByPath.size,
  network: config.network,
  payTo: config.payTo,
  relay: config.pocketApUrl ? "pocket" : "direct",
});

app.get("/", (c) => c.json(identity()));
app.get("/v1/version", (c) => c.json(identity()));
app.get("/v1/health", (c) => c.json({ status: "ok" }));
app.get("/v1/catalog", (c) => c.json(catalog));

app.get("/.well-known/x402", (c) =>
  c.json({ version: 1, resources: [...endpointsByPath.keys()].map((path) => `${config.publicBaseUrl}${path}`) }),
);

app.post("/v1/discover", async (c) => relay(c, await forwardRead(config, "POST", "/v1/discover", await c.req.text())));
app.post("/v1/inspect", async (c) => relay(c, await forwardRead(config, "POST", "/v1/inspect", await c.req.text())));
app.get("/v1/endpoints/:provider/:slug", async (c) =>
  relay(c, await forwardRead(config, "GET", `/v1/endpoints/${c.req.param("provider")}/${c.req.param("slug")}`)),
);

const mcp = mcpHandler(config, (path) => {
  const endpoint = endpointsByPath.get(path);
  return endpoint ? BigInt(endpoint.price.atomic) : undefined;
});
app.all("/mcp", (c) =>
  mcp(c.req.raw, c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown"),
);

// Payment runs before the handler: unpaid → 402 with the price; paid → handler → settle only if status < 400.
app.use(`${RUN_PREFIX}/*`, (c, next) => payments(c, next));

app.post(`${RUN_PREFIX}/:provider/:slug`, async (c) => {
  const path = `${RUN_PREFIX}/${c.req.param("provider")}/${c.req.param("slug")}`;
  if (!endpointsByPath.has(path)) {
    return jsonError(c, HTTP_NOT_FOUND, "unknown_endpoint", `no endpoint at ${path}`,
      ["POST /v1/discover with {query} to find one"]);
  }
  const body = await c.req.text();
  try {
    JSON.parse(body || "{}");
  } catch {
    return jsonError(c, HTTP_BAD_REQUEST, "invalid_json", "Request body is not valid JSON.");
  }
  let forwarded: Forwarded;
  try {
    forwarded = await forwardRun(config, path, body || "{}");
  } catch (error) {
    console.error(JSON.stringify({ event: "run_forward_failed", path, error: String(error) }));
    return jsonError(c, HTTP_BAD_GATEWAY, "relay_failed", "The tool router could not be reached; you were not charged.");
  }
  const response = relay(c, forwarded);
  response.headers.set(ENDPOINT_HEADER, path.slice(RUN_PREFIX.length + 1));
  if (forwarded.status === HTTP_OK) {
    const envelope = JSON.parse(forwarded.body) as { billable?: boolean };
    // A "does not exist" answer is data, not a sale: answer 404 so the payment middleware never settles it.
    if (envelope.billable === false) {
      return new Response(forwarded.body, { status: HTTP_NOT_FOUND, headers: response.headers });
    }
  }
  return response;
});

app.notFound((c) => jsonError(c, HTTP_NOT_FOUND, "not_found", `no route ${c.req.method} ${c.req.path}`));
app.onError((error, c) => {
  console.error(JSON.stringify({ event: "gateway_error", error: String(error) }));
  return jsonError(c, HTTP_BAD_GATEWAY, "gateway_error", "Gateway error; you were not charged.");
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(JSON.stringify({ event: "gateway_ready", port: info.port, endpoints: endpointsByPath.size,
    network: config.network, relay: config.pocketApUrl ? "pocket" : "direct" }));
});
