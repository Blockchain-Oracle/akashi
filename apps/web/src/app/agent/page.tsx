import type { Metadata } from "next";

import { AgentApp } from "@/features/agent/AgentApp";
import { chatEndpoints } from "@/features/agent/endpoints.server";

export const metadata: Metadata = { title: "Agent", description: "Chat with an agent that discovers, pays for and runs tools." };

export default async function AgentPage() {
  return <AgentApp endpoints={await chatEndpoints()} />;
}
