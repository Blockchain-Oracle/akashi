import type { Metadata } from "next";

import { AgentApp } from "@/features/agent/AgentApp";
import { chatEndpoints } from "@/features/agent/endpoints.server";

// Rendered per request: the catalog comes from the live api (its fetch is cached for CATALOG_REVALIDATE_S), never
// from whatever the api answered at image build time.
export const dynamic = "force-dynamic";


export const metadata: Metadata = { title: "Agent", description: "Chat with an agent that discovers, pays for and runs tools." };

export default async function AgentPage() {
  return <AgentApp endpoints={await chatEndpoints()} />;
}
