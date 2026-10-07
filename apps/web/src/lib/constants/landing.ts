import { DOCS_URL, GATEWAY_URL, POCKET_URL, REPO_URL, SKILL_URL, X402_URL, docsPage } from "./site";

/** Agents shown under "Give this to your agent" (Simple Icons, CC0; nominative use). */
export const AGENT_MARKS = [
  { src: "/agents/claude.svg", label: "Claude" },
  { src: "/agents/openai.svg", label: "ChatGPT / Codex" },
  { src: "/agents/googlegemini.svg", label: "Gemini" },
  { src: "/agents/cursor.svg", label: "Cursor" },
  { src: "/agents/githubcopilot.svg", label: "GitHub Copilot" },
] as const;

/** How many tool tiles the hero grid shows before the "See all" tile (Monid: 24). */
export const HERO_TILE_COUNT = 24;
export const HERO_GRID_COLUMNS = 5;
/** Hero tile order: the names agents and judges recognise first, then everything else alphabetically. */
export const HERO_PROVIDER_ORDER = [
  "firecrawl", "serper", "groq", "jina", "akashi", "wikipedia", "github", "openweather", "openalex", "arxiv",
  "hackernews", "npm", "pypi", "crossref", "wikidata", "ipinfo", "youtube", "nasa", "usgs", "pubchem",
  "worldbank", "frankfurter", "defillama", "openfoodfacts", "dictionary", "datamuse", "openlibrary", "depsdev",
  "wayback",
] as const;

export const STEPS = [
  {
    title: "Discover & compare",
    code: "akashi.discover()",
    lines: ["candidates ranked", "by fit, health & price"],
    icon: "search",
  },
  {
    title: "Run the tool",
    code: "akashi.run()",
    lines: ["use it right away", "no sign-up, no API key"],
    icon: "play",
  },
  {
    title: "Pay per call",
    code: "$0.005",
    lines: ["USDC over x402,", "relayed through Pocket"],
    icon: "wallet",
  },
] as const;

export const CONNECT_WAYS = [
  { title: "Skill", body: "One line into your agent's chat.", href: docsPage("quickstart/skill") },
  { title: "MCP", body: "Add the Akashi MCP server.", href: docsPage("quickstart/mcp") },
  { title: "CLI", body: "Install and run from your terminal.", href: docsPage("quickstart/cli") },
] as const;

/** An example session, labelled as one: what an agent types and what Akashi answers. Tool ids, inputs and prices are
 * real catalog entries; health and timings are typical values, not live readings. */
export const TERMINAL_SCRIPT = {
  path: "example session · ~/agents/research-bot",
  balance: "3.000",
  prompt: "find the latest papers on RAG hallucination and summarise what they agree on",
  steps: [
    { kind: "call", text: 'akashi_discover("research papers rag hallucination")' },
    { kind: "result", text: "1. firecrawl/research-papers      $0.005/call   healthy 2.2s" },
    { kind: "result", text: "2. openalex/works                 $0.001/call   healthy 0.9s" },
    { kind: "result", text: "3. arxiv/search                   $0.001/call   stable  1.4s" },
    { kind: "call", text: 'akashi_run("firecrawl/research-papers", {"query": "rag hallucination", "k": 5})' },
    { kind: "paid", text: "✓ 5 papers · paid $0.005 USDC · relayed over Pocket", meta: "$0.005" },
    { kind: "call", text: 'akashi_run("groq/summarize", {"text": "…5 abstracts…"})' },
    { kind: "paid", text: "✓ summary with 4 agreed findings · paid $0.005", meta: "$0.005" },
  ],
} as const;

export const STATS = [
  { value: "tools", label: "Tools across {providers} providers" },
  { value: "per call", label: "Pay only for the calls your agent makes" },
  { value: "1 wallet", label: "For every tool, every provider" },
] as const;

export const FAQ = [
  {
    q: "Do I need API keys for each provider?",
    a: "No. Akashi holds the provider keys (or uses keyless public APIs) and your agent pays per call with USDC over x402. Payment is the credential: no account, no key, no subscription.",
  },
  {
    q: "How is pricing structured?",
    a: "Every tool has one price per call, shown before you pay: $0.001 for keyless and local tools, $0.005 for standard keyed tools, $0.01 for premium ones such as live search with page content or cited answers. Discover and inspect are free.",
  },
  {
    q: "A provider failed. Do I get charged?",
    a: "No. The x402 payment is only settled after a tool returns a result. A provider error, a time-out or a lookup that finds nothing completes without settling, so your wallet is never debited for it.",
  },
  {
    q: "Where does Pocket Network come in?",
    a: "Akashi is the tool-router service on Pocket. Paid runs travel as real Pocket relays: pocket-ap signs each one with Akashi's staked application, Akashi's own supplier serves it, and the relays are claimed and settled on chain. If the relay layer is ever down, the gateway calls the backend directly and the receipt says so (via: direct), so a receipt never claims a relay that did not happen.",
  },
  {
    q: "Which agent frameworks are supported?",
    a: "Anything that can read a skill file, speak MCP or call HTTP: Claude Code, Codex, Cursor, ChatGPT, LangChain, the Vercel AI SDK, or a curl loop. The CLI and the local MCP server pay from a wallet key you control, with spend limits.",
  },
  {
    q: "What about rate limits?",
    a: "Akashi caches answers and rate-limits its calls to each provider, so a burst on a free provider may be slower or answer 429. Each tool reports its health (healthy, stable, degraded) and typical run time from Akashi's own runs, so your agent can pick a faster or cheaper alternative.",
  },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Tools", href: "/tools" },
      { label: "Agent", href: "/agent" },
      { label: "Demo", href: "/demo" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: DOCS_URL },
      { label: "SKILL.md", href: SKILL_URL },
      { label: "Catalog JSON", href: `${GATEWAY_URL}/v1/catalog` },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Pocket Network", href: POCKET_URL },
      { label: "x402", href: X402_URL },
      { label: "GitHub", href: REPO_URL },
    ],
  },
] as const;
