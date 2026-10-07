/** The generated Tools pages: one per provider, plus the overview (categories, providers, price tiers). */

import { code, codeCell, fence, frontmatter, GENERATED_NOTE, mdCell, mdText, shellQuote, table } from "./markdown.mjs";
import { inputSection } from "./schema.mjs";

export const TOOLS_ROUTE = "/docs/tools";
const API_URL = "https://api.useakashi.xyz"; // rewritten to NEXT_PUBLIC_API_URL at build (lib/remark-site-urls.ts)

/** What each price tier is for (CONNECTORS.md); a tier the catalog adds later is listed without a note. */
const TIER_NOTES = {
  local: "Keyless upstreams and local compute.",
  standard: "Keyed upstreams that are cheap per call.",
  premium: "Upstreams that cost $0.005 or more per call, or several chained calls: live search with page content, cited answers.",
};

export function endpointUrl(endpoint) {
  return `${TOOLS_ROUTE}/${endpoint.provider}#${endpoint.slug}`;
}

function endpointLink(endpoint) {
  return `[${code(endpoint.id)}](${endpointUrl(endpoint)})`;
}

function endpointLinkCell(endpoint) {
  return `[${codeCell(endpoint.id)}](${endpointUrl(endpoint)})`;
}

function priceText(price) {
  return `$${price.usd}`;
}

function priceRange(endpoints) {
  const prices = [...new Set(endpoints.map((e) => Number(e.price.usd)))].sort((a, b) => a - b);
  const first = prices[0];
  const last = prices[prices.length - 1];
  return first === last ? `$${first}` : `$${first}–$${last}`;
}

/** "openweathermap.org/api" for https://openweathermap.org/api/ */
function urlLabel(href) {
  const url = new URL(href);
  return `${url.host}${url.pathname}`.replace(/\/$/, "");
}

function categoryNames(ids, labels) {
  return ids.map((id) => labels.get(id) ?? id).join(", ");
}

function runCommand(endpoint) {
  return `node akashi.mjs run ${endpoint.id} --input ${shellQuote(JSON.stringify(endpoint.example))}`;
}

function endpointSection(endpoint, ctx) {
  const blocks = [
    `## ${mdText(endpoint.displayName)} [#${endpoint.slug}]`,
    `${code(endpoint.id)} · **${priceText(endpoint.price)}** per call (${endpoint.price.tier}) · ${mdText(categoryNames(endpoint.categories, ctx.labels))}`,
    `**${mdText(endpoint.summary)}**`,
    mdText(endpoint.description),
  ];
  if (!endpoint.available) {
    blocks.push("Not configured on the public gateway right now, so it cannot be run (`available: false` in the catalog).");
  }
  if (endpoint.notes.length > 0) blocks.push(endpoint.notes.map((n) => `- ${mdText(n)}`).join("\n"));
  const related = endpoint.seeAlso.map((id) => ctx.byId.get(id)).filter(Boolean);
  if (related.length > 0) blocks.push(`Related: ${related.map(endpointLink).join(", ")}.`);
  blocks.push(`### Input [#${endpoint.slug}-input]`, inputSection(endpoint.input));
  blocks.push(
    `### Example [#${endpoint.slug}-example]`,
    fence("json", JSON.stringify(endpoint.example, null, 2), "Input"),
    fence("bash", runCommand(endpoint), "Run it with the CLI"),
  );
  return blocks.join("\n\n");
}

function providerFacts(provider, endpoints, ctx) {
  const facts = [
    `- **Provider id:** ${code(provider.id)}`,
    `- **Tools:** ${endpoints.length}, at ${priceRange(endpoints)} per call`,
    `- **Categories:** ${mdText(categoryNames(provider.categories, ctx.labels))}`,
  ];
  if (provider.homepage) facts.push(`- **Homepage:** [${mdText(urlLabel(provider.homepage))}](${provider.homepage})`);
  if (provider.docsUrl) facts.push(`- **Provider docs:** [${mdText(urlLabel(provider.docsUrl))}](${provider.docsUrl})`);
  if (provider.licence) facts.push(`- **Licence:** ${mdText(provider.licence)}`);
  if (provider.attribution) facts.push(`- **Attribution:** ${mdText(provider.attribution)}`);
  return facts.join("\n");
}

export function providerPage(provider, endpoints, ctx) {
  const index = table(
    ["Tool", "Price", "What it does"],
    endpoints.map((e) => [endpointLinkCell(e), priceText(e.price), mdCell(e.summary)]),
  );
  const body = [
    frontmatter({ title: provider.displayName, description: provider.summary }),
    GENERATED_NOTE,
    providerFacts(provider, endpoints, ctx),
    index,
    "Inputs are JSON bodies, and unknown fields are rejected with `422 invalid_input` (not charged). `POST /v1/inspect` with a tool's id returns the same input schema, plus the output schema.",
    ...endpoints.map((e) => endpointSection(e, ctx)),
  ];
  return `${body.join("\n\n")}\n`;
}

function tierTable(catalog) {
  const tiers = new Map();
  for (const e of catalog.endpoints) {
    const tier = tiers.get(e.price.tier) ?? { price: e.price, count: 0 };
    tier.count += 1;
    tiers.set(e.price.tier, tier);
  }
  const rows = [...tiers.entries()]
    .sort((a, b) => Number(a[1].price.atomic) - Number(b[1].price.atomic))
    .map(([name, t]) => [code(name), priceText(t.price), code(t.price.atomic), mdCell(TIER_NOTES[name] ?? ""), String(t.count)]);
  return table(["Tier", "Price per call", "Atomic units", "For", "Tools"], rows);
}

function categoryTable(catalog) {
  const rows = catalog.categories.map((c) => {
    const members = catalog.endpoints.filter((e) => e.categories.includes(c.id));
    return [mdCell(c.label), code(c.id), members.map(endpointLinkCell).join(", ")];
  });
  return table(["Category", "Id", "Tools"], rows);
}

function providerTable(catalog, byProvider) {
  const rows = catalog.providers.map((p) => {
    const endpoints = byProvider.get(p.id) ?? [];
    return [`[${mdCell(p.displayName)}](${TOOLS_ROUTE}/${p.id})`, String(endpoints.length), priceRange(endpoints), mdCell(p.summary)];
  });
  return table(["Provider", "Tools", "Price", "Summary"], rows);
}

export function overviewPage(catalog, byProvider) {
  const premium = catalog.endpoints.filter((e) => e.price.tier === "premium");
  const body = [
    frontmatter({
      title: "Tools overview",
      description: "Every tool in the catalog, by category and provider, and how its price is set.",
    }),
    GENERATED_NOTE,
    `The catalog has **${catalog.endpoints.length} tools** from **${catalog.providers.length} providers**. A tool's id is ${code("provider/endpoint")}. Each tool has a fixed price per call, an input JSON Schema, an output schema and a working example.`,
    `These pages are a snapshot of the catalog (hash ${code(catalog.hash)}). The live list is ${code(`GET ${API_URL}/v1/catalog`)}, and [discover](/docs/api/discover) ranks it for a job. Health (status, p50, p95) is live data, so it appears only in discover results, not here.`,
    "## How prices work",
    "Each tool has one of three prices. You pay per successful run, in USDC on Base Sepolia, over x402. Discover and inspect are free. A run that fails, or a lookup that finds nothing, is never charged. See [Pricing and payments](/docs/pricing).",
    tierTable(catalog),
    premium.length > 0 ? `Premium tools: ${premium.map(endpointLink).join(", ")}.` : "",
    "USDC has 6 decimals, so 1000 atomic units are $0.001. The 402 response states the exact amount for each run.",
    "## Categories",
    `Pass a category id to discover to narrow the ranking: ${code('{"query": "...", "category": "weather"}')}.`,
    categoryTable(catalog),
    "## Providers",
    providerTable(catalog, byProvider),
    "## Run any tool",
    fence("bash", `node akashi.mjs inspect openweather/current\nnode akashi.mjs run openweather/current --input '{"city":"Lagos"}'`),
    "Over plain HTTP, `POST /v1/run/{provider}/{endpoint}` with the tool's input as the JSON body. Without a payment it answers `402`; see [Run](/docs/api/run).",
  ];
  return `${body.filter(Boolean).join("\n\n")}\n`;
}
