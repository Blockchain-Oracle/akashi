import { readFileSync } from "node:fs";
import path from "node:path";

import { SERVICE_ORDER, SERVICES } from "@akashi/brand";
import { createOpenAPI } from "fumadocs-openapi/server";

/**
 * The API reference is generated from the same per-service OpenAPI files the backend publishes (cards/<id>/openapi.json).
 * Their paths are prefix-free, as Pocket gateways send them; the server shown is the portal route agents call.
 */
const CARDS_DIR = path.join(process.cwd(), "../../cards");

function withServer(id: string) {
  return () => {
    const doc = JSON.parse(readFileSync(path.join(CARDS_DIR, id, "openapi.json"), "utf8"));
    return { ...doc, servers: [{ url: `https://agent.pocket.network/v1/${id}`, description: "Agentic Portal (paid per call)" }] };
  };
}

export const openapi = createOpenAPI({
  input: Object.fromEntries(SERVICE_ORDER.map((key) => [key, withServer(SERVICES[key].id)])),
});
