import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import type { Akashi } from "./client.js";
import { DEFAULT_DISCOVER_LIMIT, MCP_MAX_TEXT_CHARS, VERSION } from "./constants.js";

const text = (value: unknown) => {
  const json = JSON.stringify(value, null, 1);
  return { content: [{ type: "text" as const, text: json.length > MCP_MAX_TEXT_CHARS ? `${json.slice(0, MCP_MAX_TEXT_CHARS)}\n…[truncated]` : json }] };
};

const failure = (error: unknown) => ({
  isError: true,
  content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
});

/** The local MCP server: three tools over stdio, paying from AKASHI_PRIVATE_KEY with the session spend cap. */
export async function serveMcp(akashi: Akashi): Promise<void> {
  const server = new McpServer({ name: "akashi", version: VERSION });

  server.registerTool(
    "akashi_discover",
    {
      title: "Discover Akashi tools",
      description:
        "Free. Rank Akashi's tool catalog for a job (web search, page reading, cited answers, papers, news, weather, " +
        "maps, crypto and FX, GitHub and packages, time, dictionaries…). Returns ids, prices, health and hints.",
      inputSchema: { query: z.string().min(2), limit: z.number().int().min(1).max(25).optional() },
    },
    async ({ query, limit }) => {
      try {
        return text(await akashi.discover(query, limit ?? DEFAULT_DISCOVER_LIMIT));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "akashi_inspect",
    {
      title: "Inspect an Akashi tool",
      description: "Free. One tool's contract: description, input JSON Schema, output schema, price and a working example.",
      inputSchema: { id: z.string().describe("e.g. firecrawl/search") },
    },
    async ({ id }) => {
      try {
        return text(await akashi.inspect(id));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "akashi_run",
    {
      title: "Run an Akashi tool (paid)",
      description:
        "Runs one tool with its input, paying its price in USDC on Base Sepolia over x402 from the configured wallet " +
        "(capped per call and per session). Failed runs are never charged. Inspect first; tell the user the cost.",
      inputSchema: { id: z.string(), input: z.record(z.string(), z.unknown()) },
    },
    async ({ id, input }) => {
      try {
        const result = await akashi.run(id, input);
        return text({ ...result, sessionSpentAtomic: akashi.spentAtomic.toString() });
      } catch (error) {
        return failure(error);
      }
    },
  );

  await server.connect(new StdioServerTransport());
}
