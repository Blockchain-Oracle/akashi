/** Runtime configuration from the environment. Fails fast on anything a paid route cannot work without. */

import { DEFAULT_FACILITATOR_URL, DEFAULT_NETWORK } from "./constants.js";

const DEFAULT_PORT = 8080;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export interface GatewayConfig {
  port: number;
  /** The tool-router backend, reached directly for free reads (catalog, discover, inspect). */
  apiUrl: string;
  /** pocket-ap serve listener: paid runs become real Pocket relays through it. Unset → direct to the api. */
  pocketApUrl: string | undefined;
  /** Allow a direct call when the relay hop fails (labelled `via: direct`, never presented as a relay). */
  directFallback: boolean;
  payTo: `0x${string}`;
  network: `${string}:${string}`;
  facilitatorUrl: string;
  publicBaseUrl: string;
  corsOrigins: string[];
}

export function readConfig(): GatewayConfig {
  const payTo = required("AKASHI_PAY_TO");
  if (!ADDRESS.test(payTo)) throw new Error("AKASHI_PAY_TO must be a 0x address");
  return {
    port: Number(process.env.PORT ?? DEFAULT_PORT),
    apiUrl: required("AKASHI_API_URL").replace(/\/$/, ""),
    pocketApUrl: process.env.POCKET_AP_URL?.trim().replace(/\/$/, "") || undefined,
    directFallback: (process.env.AKASHI_DIRECT_FALLBACK ?? "true") === "true",
    payTo: payTo as `0x${string}`,
    network: (process.env.X402_NETWORK ?? DEFAULT_NETWORK) as `${string}:${string}`,
    facilitatorUrl: process.env.X402_FACILITATOR_URL ?? DEFAULT_FACILITATOR_URL,
    publicBaseUrl: (process.env.AKASHI_PUBLIC_URL ?? `http://localhost:${DEFAULT_PORT}`).replace(/\/$/, ""),
    corsOrigins: (process.env.AKASHI_CORS_ORIGINS ?? "*").split(",").map((o) => o.trim()),
  };
}
