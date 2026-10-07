import { SERVICE_ROUTES } from "@akashi/api-client";
import { SERVICE_ORDER, SERVICES, type ServiceKey } from "@akashi/brand";

/** Backend hard stops (specs/backend.md §2.10), mirrored for the deadline bar and the honest loading state. */
export const DEADLINE_MS: Record<ServiceKey, number> = {
  cite: 8_500,
  code: 7_000,
  now: 4_000,
};

/** Per-request price on the portal, in USDC (the portal charges a flat $0.005). */
export const PRICE_USDC = "0.005";

const POST = "POST ";

/** Each service's POST endpoints, from the generated OpenAPI route list (so the page cannot drift from the API). */
export const ENDPOINTS = Object.fromEntries(
  (Object.keys(SERVICES) as ServiceKey[]).map((key) => [
    key,
    SERVICE_ROUTES[SERVICES[key].id].filter((route) => route.startsWith(POST)).map((route) => route.slice(POST.length)),
  ]),
) as Record<ServiceKey, string[]>;

/** Each service's accent (D-034): 典 citations pink (the agent's voice), 符 code blue (Pocket), 今 live facts green (go). */
export type ServiceTone = "agent" | "net" | "go";
export const SERVICE_TONE: Record<ServiceKey, ServiceTone> = { cite: "agent", code: "net", now: "go" };

/** The kanji tile in a service's accent (full class names, so Tailwind can read them). */
export const TONE_TILE: Record<ServiceTone, string> = {
  agent: "bg-agent text-agent-foreground",
  net: "bg-net-band text-net-band-foreground",
  go: "bg-go text-go-foreground",
};

/** A soft tint of the accent, for chips and wells. */
export const TONE_SOFT: Record<ServiceTone, string> = {
  agent: "bg-agent-soft",
  net: "bg-net-soft",
  go: "bg-go-soft",
};

export { SERVICE_ORDER, SERVICES, type ServiceKey };
