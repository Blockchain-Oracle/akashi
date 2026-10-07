import "server-only";

import { z } from "zod";

/**
 * Server-only settings (specs/web.md §9), validated on first use rather than at import, so `next build` in CI
 * does not need runtime secrets. Everything optional has a feature that degrades without it.
 */
const LOCAL_API_URL = "http://localhost:8000";
const TEST_PORTAL_URL = "https://test.agent.pocket.network";
const FALLBACK_SERVICE_ID = "literature-search"; // a listed service on the test portal, for paid mode before listing
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const X402_FACILITATOR_URL = "https://x402.org/facilitator";
const SIWE_SECRET_MIN_CHARS = 32;

const optionalText = z.string().min(1).optional();

const schema = z.object({
  AKASHI_API_URL: z.url().default(LOCAL_API_URL),
  AKASHI_DEMO_SECRET: optionalText,
  REDIS_URL: optionalText,
  IP_HASH_SALT: optionalText,
  POCKET_PORTAL_URL: z.url().default(TEST_PORTAL_URL),
  POCKET_LISTING_OVERRIDE: z.enum(["listed", "unlisted", "auto"]).default("auto"),
  POCKET_FALLBACK_SERVICE_ID: z.string().min(1).default(FALLBACK_SERVICE_ID),
  POCKET_FALLBACK_PATH: optionalText,
  DEMO_WALLET_PRIVATE_KEY: z.string().regex(PRIVATE_KEY, "a 0x-prefixed 32-byte hex key").optional(),
  AI_MODEL: optionalText,
  ANTHROPIC_API_KEY: optionalText,
  OPENAI_API_KEY: optionalText,
  AI_GATEWAY_API_KEY: optionalText,
  // Agent chat (D-038): history in its own Redis, a signed session cookie, Akashi as its own x402 seller until listed.
  CHAT_REDIS_URL: z.url().optional(),
  SIWE_SECRET: z.string().min(SIWE_SECRET_MIN_CHARS).optional(),
  AKASHI_PAY_TO: z.string().regex(EVM_ADDRESS, "a 0x-prefixed 20-byte address").optional(),
  X402_FACILITATOR_URL: z.url().default(X402_FACILITATOR_URL),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= schema.parse(
    Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key, value || undefined])),
  );
  return cached;
}
