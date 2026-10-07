import { DEFAULT_API_URL, DEFAULT_MAX_ATOMIC_PER_CALL, DEFAULT_MAX_TOTAL_ATOMIC, PRIVATE_KEY } from "./constants.js";

export interface Config {
  apiUrl: string;
  privateKey: `0x${string}` | undefined;
  maxAtomicPerCall: bigint;
  maxTotalAtomic: bigint;
}

function atomic(name: string, fallback: bigint): bigint {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) throw new Error(`${name} must be a whole number of USDC atomic units (1 USDC = 1000000)`);
  return BigInt(raw);
}

/** Environment only, like Pocket's own agentic-portal-mcp: the key never sits in a config file Akashi writes. */
export function readConfig(): Config {
  const raw = process.env.AKASHI_PRIVATE_KEY?.trim();
  if (raw && !PRIVATE_KEY.test(raw)) throw new Error("AKASHI_PRIVATE_KEY must be 64 hex characters, with or without 0x");
  return {
    apiUrl: (process.env.AKASHI_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, ""),
    privateKey: raw ? ((raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`) : undefined,
    maxAtomicPerCall: atomic("AKASHI_MAX_ATOMIC_PER_CALL", DEFAULT_MAX_ATOMIC_PER_CALL),
    maxTotalAtomic: atomic("AKASHI_MAX_TOTAL_ATOMIC", DEFAULT_MAX_TOTAL_ATOMIC),
  };
}
