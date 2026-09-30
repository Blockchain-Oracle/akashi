import { readFileSync } from "node:fs";
import path from "node:path";

import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { createOpenAPI } from "fumadocs-openapi/server";

import { site } from "@/lib/site";

/**
 * The API reference is generated from the same per-service OpenAPI files the backend publishes (cards/<id>/openapi.json).
 * Their paths are prefix-free, as Pocket gateways send them, so each document gets a server URL here for the playground.
 */
const CARDS_DIR = path.join(process.cwd(), "../../cards");

function withServer(id: string, prefix: string) {
  return () => {
    const doc = JSON.parse(readFileSync(path.join(CARDS_DIR, id, "openapi.json"), "utf8"));
    return { ...doc, servers: [{ url: `${site.api}${prefix}`, description: "Akashi API (direct, unmetered)" }] };
  };
}

export const openapi = createOpenAPI({
  input: Object.fromEntries(SERVICE_ORDER.map((key) => [key, withServer(SERVICES[key].id, SERVICES[key].prefix)])),
  proxyUrl: "/api/proxy",
});
