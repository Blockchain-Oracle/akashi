import "server-only";

import { type Tool, tool, type ToolSet } from "ai";

import { compactInput, endpointById } from "@/lib/agent/catalog-view.server";
import { HTTP_PAYMENT_REQUIRED } from "@/lib/agent/payment-error";
import { FindToolsInput, InspectToolInput, type RunOutput, RunOutputSchema, type RunResult, RunToolInput } from "@/lib/agent/schemas";
import { type ChatMode, MAX_MODEL_OUTPUT_CHARS } from "@/lib/constants/agent";
import { demoRun } from "@/lib/server/demo-payer.server";
import { serverEnv } from "@/lib/server/env.server";

/** What `toModelOutput` returns (@ai-sdk/provider-utils `ToolResultOutput`, reached through the Tool type). */
type ToolResultOutput = Awaited<ReturnType<NonNullable<Tool["toModelOutput"]>>>;

const TRUNCATION_NOTE = "\n…[truncated]";
const OPEN = "<untrusted_tool_data>\n";
const CLOSE = "\n</untrusted_tool_data>";
const READ_TIMEOUT_MS = 6_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bounded(value: unknown): string {
  const json = JSON.stringify(value ?? null);
  return json.length > MAX_MODEL_OUTPUT_CHARS ? `${json.slice(0, MAX_MODEL_OUTPUT_CHARS)}${TRUNCATION_NOTE}` : json;
}

/**
 * The model reads only the tool's data (delimited, bounded) plus the few facts it must report: price paid,
 * whether it was charged, and the error when there is one. Receipts and timings are for the UI.
 */
export function runForModel(output: RunOutput): ToolResultOutput {
  if ("trimmed" in output) return { type: "text", value: "(older result trimmed)" };
  const body = isRecord(output.body) ? output.body : { raw: output.body };
  if ("error" in body) {
    const advice = output.status === HTTP_PAYMENT_REQUIRED || output.receipt.payer === "demo" && !output.receipt.paid
      ? " Do not retry this payment; tell the user, and suggest switching to 'My wallet'."
      : " You may try the next candidate once.";
    return { type: "text", value: `run failed (HTTP ${output.status}, not charged): ${bounded(body.error)}.${advice}` };
  }
  const head = `paid ${output.receipt.paid ? `$${body.price && isRecord(body.price) ? body.price.usd : "?"}` : "nothing"}; ` +
    `found=${String(body.found ?? true)}; as_of=${String(body.as_of ?? "")}`;
  return { type: "text", value: `${head}\n${OPEN}${bounded(body.data)}${CLOSE}` };
}

async function readJson(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${serverEnv().AKASHI_API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  });
  return res.json();
}

const findTools = tool({
  description:
    "Search Akashi's tool catalog for the job (free). Returns ranked tools with id, price, health and each tool's " +
    "input fields and an example, so you can usually run the best one directly.",
  inputSchema: FindToolsInput,
  execute: async ({ query, limit }) => {
    const found = (await readJson("/v1/discover", { query, limit })) as {
      candidates?: Array<{ id: string; summary: string; price: { usd: string }; health?: { status: string; p50Ms: number | null } }>;
      hints?: string[];
    };
    const candidates = await Promise.all(
      (found.candidates ?? []).map(async (c) => {
        const endpoint = await endpointById(c.id);
        return {
          id: c.id,
          summary: c.summary,
          price_usd: c.price.usd,
          health: c.health ? `${c.health.status}${c.health.p50Ms ? ` ${c.health.p50Ms}ms` : ""}` : "unknown",
          input: endpoint ? compactInput(endpoint) : {},
          example: endpoint?.example,
        };
      }),
    );
    return { candidates, hints: found.hints ?? [] };
  },
});

const inspectTool = tool({
  description: "Read one tool's full contract (free): what it does and will not do, its input fields and an example.",
  inputSchema: InspectToolInput,
  execute: async ({ id }) => {
    const endpoint = await endpointById(id);
    if (!endpoint) return { error: `no tool ${id}; call find_tools` };
    return {
      id,
      description: endpoint.description,
      notes: endpoint.notes,
      price_usd: endpoint.price.usd,
      input: compactInput(endpoint),
      example: endpoint.example,
    };
  },
});

async function demoExecute({ id, input }: { id: string; input: Record<string, unknown> }, ip: string): Promise<RunResult> {
  const endpoint = await endpointById(id);
  if (!endpoint) {
    return {
      id,
      status: 404,
      body: { error: { code: "unknown_endpoint", message: `no tool ${id}; call find_tools first` } },
      receipt: { paid: false, payer: "demo", network: "eip155:84532" },
      latency_ms: 0,
    };
  }
  const output = await demoRun(id, endpoint.path, input, BigInt(endpoint.price.atomic), ip);
  return { ...output, receipt: { ...output.receipt, priceUsd: endpoint.price.usd } };
}

/**
 * run_tool: in demo mode the server pays with Akashi's demo wallet; in wallet mode there is no execute, so the
 * browser shows the pay card, the visitor signs, and the client adds the output (the SDK needs an output schema
 * for a tool without execute).
 */
function runTool(mode: ChatMode, ip: string) {
  const base = {
    description:
      "Run one tool with its input (paid per call in USDC; failures are not charged). Use the id and input fields " +
      "from find_tools. Tell the user what it cost.",
    inputSchema: RunToolInput,
    outputSchema: RunOutputSchema,
    toModelOutput: ({ output }: { output: RunOutput }) => runForModel(output),
  };
  return mode === "demo" ? tool({ ...base, execute: (input) => demoExecute(input, ip) }) : tool(base);
}

export function buildTools(mode: ChatMode, ip = "unknown") {
  return { find_tools: findTools, inspect_tool: inspectTool, run_tool: runTool(mode, ip) } satisfies ToolSet;
}

export type AkashiTools = ReturnType<typeof buildTools>;
