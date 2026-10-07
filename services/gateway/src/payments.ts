/** x402 seller: one exact-price route per catalog endpoint, settled only when the run returns < 400. */

import { HTTPFacilitatorClient } from "@x402/core/server";
import type { RouteConfig } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";

import type { Catalog } from "./catalog.js";
import type { GatewayConfig } from "./config.js";
import { PAYMENT_TIMEOUT_S, SERVICE_NAME } from "./constants.js";

/** Exact `POST /v1/run/<provider>/<slug>` keys only: no wildcard, so no path can run unpaid (D-038). */
export function runRoutes(catalog: Catalog, config: GatewayConfig): Record<string, RouteConfig> {
  const routes: Record<string, RouteConfig> = {};
  for (const endpoint of catalog.endpoints) {
    if (!endpoint.available) continue;
    routes[`POST ${endpoint.path}`] = {
      accepts: {
        scheme: "exact",
        price: `$${endpoint.price.usd}`,
        network: config.network,
        payTo: config.payTo,
        maxTimeoutSeconds: PAYMENT_TIMEOUT_S,
      },
      resource: `${config.publicBaseUrl}${endpoint.path}`,
      description: `${endpoint.displayName}: ${endpoint.summary}`,
      mimeType: "application/json",
      serviceName: SERVICE_NAME,
      tags: [endpoint.provider, ...endpoint.categories],
    };
  }
  return routes;
}

export function paymentLayer(catalog: Catalog, config: GatewayConfig) {
  const facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });
  const server = new x402ResourceServer(facilitator).register(config.network, new ExactEvmScheme());
  return paymentMiddleware(runRoutes(catalog, config), server);
}
