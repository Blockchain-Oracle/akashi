import { getCatalog } from "@/lib/catalog/catalog.server";
import { CATALOG_REVALIDATE_S, DOCS_URL, GATEWAY_URL, SITE_URL } from "@/lib/constants/site";

export const revalidate = 300;

/** llms.txt: what Akashi is and every tool, one line each (generated from the live catalog). */
export async function GET() {
  const catalog = await getCatalog();
  const lines = catalog.endpoints
    .filter((e) => e.available)
    .map((e) => `- ${e.id} ($${e.price.usd}/call): ${e.summary}`);
  const body = `# Akashi

> One endpoint for agent tools on Pocket Network. Discover and inspect are free; runs are paid per call in USDC
> over x402 and delivered as Pocket relays. Skill: ${SITE_URL}/SKILL.md · Docs: ${DOCS_URL}/docs

- Discover: POST ${GATEWAY_URL}/v1/discover {"query": "..."}
- Inspect: POST ${GATEWAY_URL}/v1/inspect {"id": "provider/endpoint"}
- Run: POST ${GATEWAY_URL}/v1/run/{provider}/{endpoint} (x402, Base Sepolia USDC)
- Catalog: GET ${GATEWAY_URL}/v1/catalog (refreshed every ${CATALOG_REVALIDATE_S} s)

## Tools

${lines.join("\n")}
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
