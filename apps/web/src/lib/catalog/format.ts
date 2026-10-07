import type { CatalogEndpoint, Health } from "./types";

const PRICE_DECIMALS = 4;
const MS_PER_S = 1000;
const SECONDS_DECIMALS = 1;

/** "$0.0050" — Monid prints four decimals per call. */
export const formatPrice = (usd: string) => `$${Number(usd).toFixed(PRICE_DECIMALS)}`;

export function formatHealth(health: Health | null | undefined): string {
  if (!health || health.status === "unknown") return "new";
  const typical = health.p50Ms === null ? "" : ` ${(health.p50Ms / MS_PER_S).toFixed(SECONDS_DECIMALS)}s`;
  return `${health.status}${typical}`;
}

/** The prompt an agent gets for one endpoint ("Use it with your agent"). */
export const endpointPrompt = (skillUrl: string, endpoint: CatalogEndpoint) =>
  `Set up ${skillUrl}, then use Akashi's ${endpoint.id} tool: ${endpoint.summary.charAt(0).toLowerCase()}${endpoint.summary.slice(1)}`;

export const providerPrompt = (skillUrl: string, providerName: string) =>
  `Set up ${skillUrl}, and then use Akashi to show me what I can do with ${providerName}.`;
