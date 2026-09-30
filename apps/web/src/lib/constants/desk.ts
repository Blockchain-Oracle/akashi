/** The Evidence desk (specs/web.md §4). */
export const MAX_REQUEST_BYTES = 65_536;
export const MAX_CITATIONS_PER_RUN = 10; // the Citation Verifier's own batch limit
export const MAX_PACKAGES_PER_RUN = 20;
export const MIN_CITATION_CHARS = 12;
export const DEMO_LIMIT_PER_IP = 20;
export const DEMO_WINDOW_S = 3_600;
export const BACKEND_MARGIN_MS = 1_500; // on top of a service's hard stop: the hop from web to api

export type DeskService = "cite" | "code" | "now";
export type DeskMode = "auto" | DeskService;

/** Real cases, each landing a known verdict (specs/web.md §4). */
export const EXAMPLES: { label: string; input: string }[] = [
  { label: "Varghese v. China Southern", input: "Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019)" },
  { label: "Wakefield 1998 (Lancet)", input: "10.1016/S0140-6736(97)11096-0" },
  { label: "axios.fetchJson()", input: 'import axios from "axios";\n\nconst users = await axios.fetchJson("/api/users");\n' },
  { label: "import reqeusts", input: 'import reqeusts\n\nr = reqeusts.get("https://example.com")\nprint(r.status_code)\n' },
  { label: "Time in Casablanca", input: "What time is it in Casablanca?" },
  { label: "USD → BRL, how fresh?", input: "USD to BRL" },
];
