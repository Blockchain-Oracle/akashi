/** The Evidence desk (specs/web.md §4, specs/ui-revamp.md §5). */
export const MAX_REQUEST_BYTES = 65_536;
export const MAX_CITATIONS_PER_RUN = 10; // the Citation Verifier's own batch limit
export const MAX_PACKAGES_PER_RUN = 20;
export const MIN_CITATION_CHARS = 12;
export const DEMO_LIMIT_PER_IP = 20;
export const DEMO_WINDOW_S = 3_600;
export const BACKEND_MARGIN_MS = 1_500; // on top of a service's hard stop: the hop from web to api

export type DeskService = "cite" | "code" | "now";
export type DeskMode = "auto" | DeskService;

export interface Exhibit {
  label: string;
  /** the question this check answers, said before the answer so nothing is promised */
  question: string;
  service: DeskService;
  input: string;
}

/** Real cases, one tap each: the exhibits row under the desk. */
export const EXHIBITS: Exhibit[] = [
  {
    label: "Varghese v. China Southern",
    question: "Real case?",
    service: "cite",
    input: "Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019)",
  },
  { label: "Wakefield 1998, The Lancet", question: "Retracted?", service: "cite", input: "10.1016/S0140-6736(97)11096-0" },
  {
    label: "axios.fetchJson()",
    question: "Real method?",
    service: "code",
    input: 'import axios from "axios";\n\nconst users = await axios.fetchJson("/api/users");\n',
  },
  {
    label: "import reqeusts",
    question: "Typo-squat?",
    service: "code",
    input: 'import reqeusts\n\nr = reqeusts.get("https://example.com")\nprint(r.status_code)\n',
  },
  { label: "Time in Casablanca", question: "Which offset?", service: "now", input: "What time is it in Casablanca?" },
  { label: "USD → BRL", question: "How fresh?", service: "now", input: "USD to BRL" },
];
