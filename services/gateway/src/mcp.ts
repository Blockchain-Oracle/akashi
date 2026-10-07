/**
 * Remote MCP at /mcp (Streamable HTTP, stateless): `claude mcp add --transport http akashi <gateway>/mcp`.
 * discover / inspect are free; akashi_run is paid by Akashi's demo wallet through this gateway's own x402 route,
 * so a run from any MCP client is a real Base Sepolia settlement and a real Pocket relay, capped per visitor per day.
 * For runs on your own wallet, use the local MCP (`node akashi.mjs mcp` with AKASHI_PRIVATE_KEY).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

import type { GatewayConfig } from "./config.js";
import {
  DAY_MS,
  DEFAULT_DISCOVER_LIMIT,
  MAX_DISCOVER_LIMIT,
  MCP_DEMO_DAILY_ATOMIC,
  MCP_DEMO_MAX_ATOMIC_PER_CALL,
  MCP_DEMO_PER_IP_DAILY_ATOMIC,
  MCP_MAX_TEXT_CHARS,
  RUN_PREFIX,
} from "./constants.js";
import { forwardRead } from "./relay.js";

const NOTHING = BigInt(0);
const ledger = { day: 0, total: NOTHING, perIp: new Map<string, bigint>() };

function book(): typeof ledger {
  const day = Math.floor(Date.now() / DAY_MS);
  if (ledger.day !== day) Object.assign(ledger, { day, total: NOTHING, perIp: new Map<string, bigint>() });
  return ledger;
}

const text = (value: unknown) => {
  const json = typeof value === "string" ? value : JSON.stringify(value, null, 1);
  return { content: [{ type: "text" as const, text: json.length > MCP_MAX_TEXT_CHARS ? `${json.slice(0, MCP_MAX_TEXT_CHARS)}\n…[truncated]` : json }] };
};
const failure = (message: string) => ({ isError: true, content: [{ type: "text" as const, text: message }] });

function demoFetch(key: string | undefined): typeof fetch | null {
  if (!key) return null;
  const withinCap = <R extends { amount: string }>(_v: number, options: R[]): R => {
    const ok = options.find((o) => BigInt(o.amount) <= MCP_DEMO_MAX_ATOMIC_PER_CALL);
    if (!ok) throw new Error("the demo wallet does not pay more than $0.01 per call");
    return ok;
  };
  const client = new x402Client(withinCap);
  registerExactEvmScheme(client, { signer: privateKeyToAccount(key as `0x${string}`), paymentRequirementsSelector: withinCap });
  return wrapFetchWithPayment(fetch, client);
}

export function mcpHandler(config: GatewayConfig, priceOf: (path: string) => bigint | undefined) {
  const pay = demoFetch(process.env.DEMO_WALLET_PRIVATE_KEY?.trim());
  const self = `http://127.0.0.1:${config.port}`;

  return async (request: Request, ip: string): Promise<Response> => {
    const server = new McpServer({ name: "akashi", version: "0.1.0" });

    server.registerTool(
      "akashi_discover",
      {
        title: "Discover Akashi tools",
        description:
          "Free. Rank Akashi's catalog for a job (web search, page reading, cited answers, papers, news, weather, " +
          "maps, crypto and FX, GitHub and packages, time, dictionaries…): ids, prices, health, hints.",
        inputSchema: { query: z.string().min(2), limit: z.number().int().min(1).max(MAX_DISCOVER_LIMIT).optional() },
      },
      async ({ query, limit }) => {
        const out = await forwardRead(config, "POST", "/v1/discover", JSON.stringify({ query, limit: limit ?? DEFAULT_DISCOVER_LIMIT }));
        return text(out.body);
      },
    );

    server.registerTool(
      "akashi_inspect",
      {
        title: "Inspect an Akashi tool",
        description: "Free. One tool's contract: description, input JSON Schema, output schema, price and a working example.",
        inputSchema: { id: z.string().describe("e.g. wikipedia/summary") },
      },
      async ({ id }) => text((await forwardRead(config, "POST", "/v1/inspect", JSON.stringify({ id }))).body),
    );

    server.registerTool(
      "akashi_run",
      {
        title: "Run an Akashi tool",
        description:
          "Run one tool with its input. On this remote server Akashi's demo wallet pays (x402, Base Sepolia, capped " +
          "per visitor per day); every run is relayed over Pocket Network and failures are never charged.",
        inputSchema: { id: z.string(), input: z.record(z.string(), z.unknown()) },
      },
      async ({ id, input }) => {
        const path = `${RUN_PREFIX}/${id}`;
        const price = priceOf(path);
        if (price === undefined) return failure(`no tool ${id}; call akashi_discover first`);
        if (!pay) return failure("Demo runs are off on this server. Use the local MCP with your own wallet: node akashi.mjs mcp");
        const ledgerNow = book();
        const used = ledgerNow.perIp.get(ip) ?? NOTHING;
        if (used + price > MCP_DEMO_PER_IP_DAILY_ATOMIC || ledgerNow.total + price > MCP_DEMO_DAILY_ATOMIC) {
          return failure("Today's demo credit is used up. Run tools on your own wallet with the local MCP: node akashi.mjs mcp");
        }
        const res = await pay(`${self}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input ?? {}),
        });
        const header = res.headers.get("PAYMENT-RESPONSE");
        const settle = header ? decodePaymentResponseHeader(header) : null;
        if (settle?.success) {
          ledgerNow.total += price;
          ledgerNow.perIp.set(ip, used + price);
        }
        const body = await res.json().catch(() => ({}));
        return text({ status: res.status, paid: Boolean(settle?.success), transaction: settle?.transaction, via: res.headers.get("X-Akashi-Via"), result: body });
      },
    );

    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(request);
  };
}
