/** Tool inputs the model fills, and the run output the UI and the transcript keep. */
import { z } from "zod";

import { FIND_TOOLS_DEFAULT, FIND_TOOLS_MAX } from "@/lib/constants/agent";

const ENDPOINT_ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;

export const FindToolsInput = z.object({
  query: z.string().min(2).describe("The job in plain words, e.g. 'recent papers on RAG hallucination' or 'weather in Lagos'"),
  limit: z.number().int().min(1).max(FIND_TOOLS_MAX).default(FIND_TOOLS_DEFAULT).describe("How many candidates to return"),
});

export const InspectToolInput = z.object({
  id: z.string().regex(ENDPOINT_ID).describe("An endpoint id from find_tools, e.g. firecrawl/search"),
});

export const RunToolInput = z.object({
  id: z.string().regex(ENDPOINT_ID).describe("The endpoint id to run, exactly as find_tools returned it"),
  input: z
    .record(z.string(), z.unknown())
    .describe("The endpoint's input as a JSON object, using only the fields its schema lists"),
});

/** How a run was paid: always shown on the receipt card. */
export const ReceiptSchema = z.object({
  paid: z.boolean(),
  payer: z.enum(["demo", "wallet"]),
  network: z.string(),
  amountAtomic: z.string().optional(),
  priceUsd: z.string().optional(),
  transaction: z.string().optional(),
  payerAddress: z.string().optional(),
  payTo: z.string().optional(),
  via: z.enum(["pocket", "direct"]).optional(),
  note: z.string().optional(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

/**
 * What run_tool returns to the UI and the transcript: the gateway's body (an envelope, or an error object), its
 * status, and the receipt. Old outputs trimmed from a long transcript become `{ trimmed: true }`.
 */
export const RunOutputSchema = z.union([
  z.object({
    id: z.string(),
    status: z.number(),
    body: z.unknown(),
    receipt: ReceiptSchema,
    latency_ms: z.number(),
  }),
  z.object({ trimmed: z.literal(true) }),
]);
export type RunOutput = z.infer<typeof RunOutputSchema>;
/** A run that happened (not a trimmed placeholder). */
export type RunResult = Exclude<RunOutput, { trimmed: true }>;
