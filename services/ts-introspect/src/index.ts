// HTTP server: POST /symbols {pkg, version?, symbols[]} → answers. Every response is a JSON object.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { MAX_REQUEST_BYTES, MAX_SYMBOLS_PER_REQUEST, PORT } from "./constants.ts";
import { NotFound } from "./fetch.ts";
import { lookup } from "./lookup.ts";
import { build } from "./program.ts";

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
}

function fail(res: ServerResponse, status: number, code: string, message: string): void {
  send(res, status, { error: { code, message, retryable: status >= 500 } });
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_REQUEST_BYTES) return null;
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function handleSymbols(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);
  if (raw === null) return fail(res, 413, "payload_too_large", "Request body exceeds the size limit.");
  let body: { pkg?: unknown; version?: unknown; symbols?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(res, 400, "invalid_json", "Request body is not valid JSON.");
  }
  const { pkg, version, symbols } = body;
  if (typeof pkg !== "string" || !Array.isArray(symbols) || symbols.length === 0 ||
      symbols.length > MAX_SYMBOLS_PER_REQUEST || !symbols.every((s) => typeof s === "string")) {
    return fail(res, 422, "invalid_input", `Expected {pkg: string, version?: string, symbols: string[1..${MAX_SYMBOLS_PER_REQUEST}]}.`);
  }
  try {
    const built = await build(pkg, typeof version === "string" && version ? version : "latest");
    send(res, 200, {
      package: pkg, version: built.version, types_from: built.typesFrom,
      results: (symbols as string[]).map((s) => lookup(built, pkg, s)),
    });
  } catch (err) {
    if (err instanceof NotFound) return fail(res, 404, "not_found", "Package or version not found on npm.");
    console.error(JSON.stringify({ event: "introspect_failed", pkg, error: String(err) }));
    fail(res, 502, "upstream_unavailable", "Could not load package type definitions.");
  }
}

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { status: "ok" });
  if (req.method === "POST" && req.url === "/symbols") {
    handleSymbols(req, res).catch(() => fail(res, 500, "internal", "Internal error."));
    return;
  }
  fail(res, 404, "not_found", "Not Found");
}).listen(PORT, () => console.log(JSON.stringify({ event: "listening", port: PORT })));
