/** The agent chat (specs/web.md §7, D-036, D-038): every limit the server and the client share, named once. */
import type { ServiceKey } from "@akashi/brand";

export const CHAT_MESSAGES_PER_IP_PER_HOUR = 30;
export const CHAT_WINDOW_S = 3_600;
export const MAX_INPUT_CHARS = 4_000;
export const MAX_TOOL_CALLS_PER_TURN = 4;
export const MAX_AGENT_STEPS = 6;
export const AGENT_TIMEOUT_MS = 60_000;
export const MAX_MODEL_OUTPUT_CHARS = 8_000; // of supplier data per tool result, so one envelope cannot flood the context
export const MAX_SNIPPET_CHARS = 8_000; // the Code Reality Check's own snippet limit
export const MAX_TRANSCRIPT_BYTES = 524_288;
export const MAX_CHATS_PER_OWNER = 200;
export const TITLE_MAX = 120;
export const FALLBACK_TITLE_MAX = 48;
export const NEW_CHAT_TITLE = "New chat";
export const MESSAGE_ID_SIZE = 16;
export const CHAT_ID_SIZE = 16;
export const CHAT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/; // opaque token: the id reaches Redis keys
export const GUEST_CHAT_TTL_S = 2_592_000; // 30 days: guests keep history for a month, wallets keep it for good
export const SESSION_COOKIE = "akashi_sid";
export const SESSION_TTL_S = 2_592_000;
export const SESSION_ID_BYTES = 18;
export const TITLE_SOURCE_MAX_CHARS = 1_000; // how much of the first message the title model sees
export const TITLE_MAX_TOKENS = 24;
export const TITLE_TIMEOUT_MS = 8_000;

export type ChatMode = "free" | "pocket";

export const TOOL_NAMES = [
  "verify_citations",
  "check_claim",
  "check_code",
  "check_packages",
  "check_symbol",
  "now_time",
  "now_fx",
  "now_holidays",
  "now_weather",
  "now_fact",
  "now_news",
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export interface ToolMeta {
  service: ServiceKey;
  /** the backend route under the service prefix */
  path: string;
  /** what the row says while the call is in flight */
  verb: string;
}

export const TOOL_META: Record<ToolName, ToolMeta> = {
  verify_citations: { service: "cite", path: "/v1/verify", verb: "Verifying citations" },
  check_claim: { service: "cite", path: "/v1/claim", verb: "Checking the claim against its source" },
  check_code: { service: "code", path: "/v1/check", verb: "Checking the snippet" },
  check_packages: { service: "code", path: "/v1/packages", verb: "Checking packages" },
  check_symbol: { service: "code", path: "/v1/symbol", verb: "Checking the symbol" },
  now_time: { service: "now", path: "/v1/time", verb: "Reading the clock" },
  now_fx: { service: "now", path: "/v1/fx", verb: "Fetching exchange rates" },
  now_holidays: { service: "now", path: "/v1/holidays", verb: "Listing holidays" },
  now_weather: { service: "now", path: "/v1/weather", verb: "Reading the weather" },
  now_fact: { service: "now", path: "/v1/fact", verb: "Looking up the fact" },
  now_news: { service: "now", path: "/v1/news", verb: "Scanning the news" },
};

export interface Suggestion {
  label: string;
  prompt: string;
}

/** The seven starters from specs/web.md §7, one per service story and one that needs all three. */
export const SUGGESTIONS: Suggestion[] = [
  {
    label: "Is this case real?",
    prompt:
      "A brief I was handed cites Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019). Is it a real case, and is it cited for what the brief says?",
  },
  {
    label: "Summarize Wakefield 1998",
    prompt:
      "Give me a two-sentence summary of Wakefield et al., The Lancet, 1998 (doi:10.1016/S0140-6736(97)11096-0) and tell me whether I can cite it.",
  },
  {
    label: "Review axios.fetchJson",
    prompt:
      'Review this snippet before I ship it:\n\nimport axios from "axios";\n\nconst users = await axios.fetchJson("/api/users");',
  },
  { label: "npm i react-codeshift?", prompt: "Should I `npm i react-codeshift`? Is it the package people mean?" },
  {
    label: "Casablanca call → New York",
    prompt:
      "I have a call at 10:00 in Casablanca tomorrow. What time is that in New York, and is either side on a public holiday?",
  },
  { label: "1,000 USD → BRL", prompt: "What is 1,000 USD in BRL right now, and how fresh is that rate?" },
  {
    label: "Check a README intro",
    prompt:
      'Check this README intro for me:\n\n"This project builds on the transformer architecture introduced in \'Attention Is All You Need\' (Vaswani et al., 2017). Install with `pip install reqeusts` and run `python main.py`. Last updated today, Tokyo time."\n\nIs the citation real, is the install line safe, and what is today\'s date in Tokyo?',
  },
];

export const HISTORY_GROUPS = ["Pinned", "Today", "Yesterday", "Earlier"] as const;
export type HistoryGroup = (typeof HISTORY_GROUPS)[number];
