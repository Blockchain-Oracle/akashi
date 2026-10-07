/**
 * The story below the desk (specs/ui-revamp.md §5). Every number is sourced: the research notes in
 * context/06-research (02-user-demand-and-pain-points, sources-code-reality-check, sources-live-facts) and this repo.
 */

export type Failure = {
  prefix?: string;
  value: number;
  decimals: number;
  suffix?: string;
  claim: string;
  source: string;
  href?: string;
};

export const FAILURES: Failure[] = [
  {
    value: 2_095,
    decimals: 0,
    claim: "court cases where a judge dealt with AI-invented material",
    source: "Charlotin database · 2026-09-28",
    href: "https://www.damiencharlotin.com/hallucinations/",
  },
  {
    prefix: "4.6–",
    value: 6.1,
    decimals: 1,
    suffix: "%",
    claim: "of package names that five frontier models suggest do not exist",
    source: "arXiv 2605.17062 · 2026",
    href: "https://arxiv.org/abs/2605.17062",
  },
  {
    prefix: ">",
    value: 60,
    decimals: 0,
    suffix: "%",
    claim: "of AI search answers that cited their source wrong",
    source: "Tow Center, CJR · March 2025",
    href: "https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php",
  },
  {
    value: 0.45,
    decimals: 2,
    suffix: "%",
    claim: "between three free USD→BRL feeds, and one was two days old without saying so",
    source: "measured by Akashi · 2026-09-29",
  },
];

/** The ✦ facts row under the hero: what is true today, each verifiable in this repo or on-chain. */
export const FACTS: string[] = [
  "3 services registered on Pocket Beta",
  "40 / 40 · 40 / 40 citation calibration",
  "$0.005 a check, no account",
  "8 package registries · 7 citation indexes",
  "every answer with its sources and its age",
];

/** How long a number takes to count up once it scrolls into view. */
export const TICKER_DURATION_S = 1.6;

/** The pricing slip: what one call costs on the portal (docs/pocket/payment) and what the free demo allows. */
export const RECEIPT_LINES: [item: string, value: string][] = [
  ["1 verification", "$0.005"],
  ["Paid in", "USDC · Base (x402)"],
  ["or", "USDC.e · Tempo (MPP)"],
  ["Account or API key", "none"],
];

export const RECEIPT_WAIVERS: [item: string, value: string][] = [
  ["Fails its schema", "not charged"],
  ["Free on this page", "20 / hour"],
];

/** "Said with confidence": six things assistants have said, each checked against the record (from the live service). */
export interface Claim {
  service: "cite" | "code" | "now";
  says: string;
  verdict: string;
  found: string;
  where: string;
}

export const CLAIMS: Claim[] = [
  {
    service: "cite",
    says: "See Varghese v. China Southern Airlines, 925 F.3d 1339 (11th Cir. 2019).",
    verdict: "not_found",
    found: "Page 1339 falls inside a different case. No case starts there.",
    where: "Caselaw Access Project",
  },
  {
    service: "code",
    says: "Just run pip install reqeusts and you are set.",
    verdict: "does_not_exist",
    found: "No such package on PyPI. You mean requests.",
    where: "PyPI",
  },
  {
    service: "now",
    says: "One US dollar buys about 0.92 euros.",
    verdict: "stale",
    found: "0.8807 by the European Central Bank; the other central banks agree.",
    where: "ECB · Bank of Canada · Bank of England",
  },
  {
    service: "cite",
    says: "Wakefield et al., The Lancet (1998), showed a link between the MMR vaccine and autism.",
    verdict: "retracted",
    found: "Retracted on 6 February 2010. The paper exists; its claim was withdrawn.",
    where: "Crossref · Retraction Watch",
  },
  {
    service: "code",
    says: "Call axios.fetchJson('/api/users') to get the JSON back.",
    verdict: "nonexistent_symbol",
    found: "axios has no fetchJson. The nearest real method is axios.get.",
    where: "npm · the package's own typings",
  },
  {
    service: "now",
    says: "Morocco is on UTC+1 all year round.",
    verdict: "stale",
    found: "Morocco moved to permanent UTC on 20 September 2026. tzdata 2026d.",
    where: "IANA time zone database",
  },
];

/** One section per service: the question, three facts, and a real request → response for the window. */
export interface Showcase {
  service: "cite" | "code" | "now";
  question: string;
  facts: string[];
  request: string;
  response: string;
}

export const SHOWCASES: Showcase[] = [
  {
    service: "cite",
    question: "Is this source real?",
    facts: [
      "DOIs, arXiv, PubMed, US case law and web pages in one call",
      "Six typed verdicts: verified, mismatch, not_found, retracted, ambiguous, unverifiable",
      "Field-level differences, retraction dates, and whether a source supports a claim",
    ],
    request: `POST /cite/v1/verify
{ "citations": ["Varghese v. China Southern Airlines Co.,
   925 F.3d 1339 (11th Cir. 2019)"] }`,
    response: `{
  "verdict": "not_found",
  "reasons": ["page 1339 falls inside J.D. v. Azar
              (925 F.3d 1291-1349); no case starts there"],
  "sources": [{ "name": "cap", "status": "ok", "licence": "CC0" }],
  "as_of": "2026-10-06T17:02:11Z"
}`,
  },
  {
    service: "code",
    question: "Does this code exist?",
    facts: [
      "npm, PyPI, crates.io, Go, Maven and more: does the package, the version, the symbol exist",
      "Typo-squats, placeholder packages and suspiciously new names flagged",
      "Paste a snippet and every import and call is checked line by line",
    ],
    request: `POST /code/v1/packages
{ "items": [{ "ecosystem": "pypi", "name": "reqeusts" }] }`,
    response: `{
  "results": [{
    "name": "reqeusts",
    "verdict": "does_not_exist",
    "did_you_mean": ["requests"],
    "evidence": ["1 edit from requests (2.4B downloads)"]
  }],
  "sources": [{ "name": "pypi", "status": "ok" }]
}`,
  },
  {
    service: "now",
    question: "Is this still true today?",
    facts: [
      "Time and holidays, exchange rates, weather, news, stocks and jobs",
      "Every answer with its sources compared, its age, and whether they agree",
      "The time zone database is current to the week, not to the model's training",
    ],
    request: `POST /now/v1/time
{ "place": "Casablanca" }`,
    response: `{
  "local_time": "2026-10-06T12:24:08+00:00",
  "utc_offset": "+00:00",
  "zone": "Africa/Casablanca",
  "tzdata": "2026d",
  "provenance": { "freshness": "fresh", "sources": ["iana-tzdb"] }
}`,
  },
];

/** The blue band's slogans (HTTPie: "Open source. Open hearted. Open minded."). */
export const BAND_LINES = ["Check first.", "Then answer.", "Half a cent."] as const;

/** The sources the three services read, as the trust row. */
export const SOURCES: { short: string; name: string }[] = [
  { short: "Cr", name: "Crossref" },
  { short: "OA", name: "OpenAlex" },
  { short: "DC", name: "DataCite" },
  { short: "EPMC", name: "Europe PMC" },
  { short: "CAP", name: "Caselaw Access" },
  { short: "IA", name: "Wayback Machine" },
  { short: "npm", name: "npm" },
  { short: "PyPI", name: "PyPI" },
  { short: "crates", name: "crates.io" },
  { short: "Go", name: "pkg.go.dev" },
  { short: "deps", name: "deps.dev" },
  { short: "ECB", name: "European Central Bank" },
  { short: "IANA", name: "tz database" },
  { short: "Nager", name: "Nager.Date" },
  { short: "MET", name: "MET Norway" },
  { short: "WD", name: "Wikidata" },
  { short: "GDELT", name: "GDELT" },
  { short: "HN", name: "Hacker News" },
];
