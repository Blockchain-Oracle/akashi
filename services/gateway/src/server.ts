/**
 * akashi-gateway: the public front door (api.<domain>).
 *   free   GET  /v1/catalog · POST /v1/discover · POST /v1/inspect · GET /v1/endpoints/:p/:s · /.well-known/x402
 *   paid   POST /v1/run/:provider/:slug  — x402 exact payment, relayed over Pocket, settled only on success
 *   paid   POST /v2/run/:provider/:slug  — the same tools in mainnet USDC (CDP facilitator), payable from PayBox
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
  HTTP_UNPROCESSABLE,
  MAX_BODY_BYTES,
  RUN_PREFIX,
  RUN_V2_PREFIX,
  SERVICE_ID,
  SPEC_PATH,
  VALIDATE_PREFIX,
  VIA_HEADER,
} from "./constants.js";
import { mcpHandler } from "./mcp.js";
import { mainnetPaymentLayer, paymentLayer } from "./payments.js";
import { forwardRead, forwardRun } from "./relay.js";
import type { Forwarded } from "./relay.js";

const config = readConfig();
let catalog: Catalog = await loadCatalog(config.apiUrl);
let endpointsByPath = new Map(catalog.endpoints.filter((e) => e.available).map((e) => [e.path, e]));
let payments = paymentLayer(catalog, config);
const mainnetLayer = (c: Catalog) => (config.mainnet ? mainnetPaymentLayer(c, config, config.mainnet) : undefined);
let mainnetPayments = mainnetLayer(catalog);

/** A new api deploy can add, remove or reprice tools: swap the catalog and the paid route tables atomically. */
async function refreshCatalog(): Promise<void> {
  try {
    const next = await loadCatalog(config.apiUrl, 1);
    if (next.hash === catalog.hash) return;
    catalog = next;
    endpointsByPath = new Map(next.endpoints.filter((e) => e.available).map((e) => [e.path, e]));
    payments = paymentLayer(next, config);
    mainnetPayments = mainnetLayer(next);
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
// The OpenAPI document the on-chain service card links to (A8: every spec URL resolves over https).
app.get(SPEC_PATH, async (c) => relay(c, await forwardRead(config, "GET", SPEC_PATH)));

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

/** The catalog keys every tool by its /v1 path; /v2 serves the same tool, so lookups and runs use the /v1 path. */
const catalogPath = (c: Context) => `${RUN_PREFIX}/${c.req.param("provider")}/${c.req.param("slug")}`;

/**
 * Before any 402: an input that cannot run is rejected for free (nobody signs for a 422).
 * On /v2 an empty body goes straight to the 402: x402 buyers such as PayBox's use_service probe the price
 * without the body and send it only on the paid retry, which the api validates again (a 422 then is not settled).
 */
function prevalidate(emptyBodyProbesPrice: boolean) {
  return async (c: Context, next: () => Promise<void>) => {
    if (c.req.header("payment-signature") || c.req.header("x-payment")) return next();
    const path = catalogPath(c);
    if (!endpointsByPath.has(path)) return next();
    const body = await c.req.raw.clone().text();
    if (emptyBodyProbesPrice && !body.trim()) return next();
    const checked = await forwardRead(config, "POST", path.replace(RUN_PREFIX, VALIDATE_PREFIX), body || "{}");
    // Only a verdict on the input blocks (400 bad JSON, 422 bad fields); anything else (an older api without
    // /v1/validate, a hiccup) falls through to the normal paid path, where the api validates again anyway.
    // The verdict ran no tool and crossed no relay, so it carries no X-Akashi-Via: no receipt claims a delivery path.
    return checked.status === HTTP_BAD_REQUEST || checked.status === HTTP_UNPROCESSABLE
      ? new Response(checked.body, { status: checked.status, headers: { "content-type": checked.contentType } })
      : next();
  };
}

app.post(`${RUN_PREFIX}/:provider/:slug`, prevalidate(false));
app.post(`${RUN_V2_PREFIX}/:provider/:slug`, prevalidate(true));

// Payment runs before the handler: unpaid → 402 with the price; paid → handler → settle only if status < 400.
app.use(`${RUN_PREFIX}/*`, (c, next) => payments(c, next));
app.use(`${RUN_V2_PREFIX}/*`, async (c, next) =>
  mainnetPayments ? mainnetPayments(c, next) : jsonError(c, HTTP_NOT_FOUND, "mainnet_disabled", "Mainnet runs are not enabled on this gateway."));

app.post(`${RUN_PREFIX}/:provider/:slug`, runTool);
app.post(`${RUN_V2_PREFIX}/:provider/:slug`, runTool);

async function runTool(c: Context) {
  const path = catalogPath(c);
  if (!endpointsByPath.has(path)) {
    return jsonError(c, HTTP_NOT_FOUND, "unknown_endpoint", `no endpoint at ${c.req.path}`,
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
}

app.notFound((c) => jsonError(c, HTTP_NOT_FOUND, "not_found", `no route ${c.req.method} ${c.req.path}`));
app.onError((error, c) => {
  console.error(JSON.stringify({ event: "gateway_error", error: String(error) }));
  return jsonError(c, HTTP_BAD_GATEWAY, "gateway_error", "Gateway error; you were not charged.");
});

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(JSON.stringify({ event: "gateway_ready", port: info.port, endpoints: endpointsByPath.size,
    network: config.network, mainnet: config.mainnet?.network ?? null, relay: config.pocketApUrl ? "pocket" : "direct" }));
});
