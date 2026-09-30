import { SERVICE_ROUTES } from "@akashi/api-client";
import { SERVICES, type ServiceKey } from "@akashi/brand";

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

export { SERVICES, type ServiceKey };
