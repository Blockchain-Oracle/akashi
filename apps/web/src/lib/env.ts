import { z } from "zod";

/**
 * Public (browser-visible) settings, validated once at import. NEXT_PUBLIC_* values are inlined at build time, and
 * only when referenced by their full literal name, so each is read explicitly below. An empty string (an unset CI
 * variable passed as a build arg) counts as unset.
 */
const LOCAL_APP_URL = "http://localhost:3100";
const LOCAL_DOCS_URL = "http://localhost:3200";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default(LOCAL_APP_URL),
  NEXT_PUBLIC_DOCS_URL: z.url().default(LOCAL_DOCS_URL),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: z.url().optional(),
});

const orUnset = (value: string | undefined) => value || undefined;

export const publicEnv = schema.parse({
  NEXT_PUBLIC_APP_URL: orUnset(process.env.NEXT_PUBLIC_APP_URL),
  NEXT_PUBLIC_DOCS_URL: orUnset(process.env.NEXT_PUBLIC_DOCS_URL),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: orUnset(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: orUnset(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
});
