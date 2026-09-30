/**
 * One typed client for all three Akashi services, generated from the per-service OpenAPI the backend publishes.
 * The same client serves the free demo (baseUrl = the web app's demo proxy) and paid calls (baseUrl = the
 * same-origin Pocket proxy, fetch = an x402-paying fetch): only the transport changes.
 */
import createClient, { type Client } from "openapi-fetch";

import type { paths as CitePaths, components as CiteComponents } from "./generated/cite";
import type { paths as CodePaths, components as CodeComponents } from "./generated/code";
import type { paths as NowPaths, components as NowComponents } from "./generated/now";

export { SERVICE_ROUTES, type ServiceId, type ServiceRoute } from "./generated/routes";
export type { CitePaths, CodePaths, NowPaths };

export type CiteSchemas = CiteComponents["schemas"];
export type CodeSchemas = CodeComponents["schemas"];
export type NowSchemas = NowComponents["schemas"];

export interface ServicePaths {
  cite: CitePaths;
  code: CodePaths;
  now: NowPaths;
}

export interface ClientOptions {
  /** Where `/v1/...` paths are appended, e.g. `/api/demo/cite` or `/api/pocket/citation-verify`. */
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export function createServiceClient<K extends keyof ServicePaths>(
  _service: K,
  options: ClientOptions,
): Client<ServicePaths[K]> {
  return createClient<ServicePaths[K]>({ baseUrl: options.baseUrl, fetch: options.fetch });
}
