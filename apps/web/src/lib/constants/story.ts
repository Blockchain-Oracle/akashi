/**
 * The below-the-fold story (specs/web.md §3). Every number is sourced: the research notes in
 * context/06-research (02-user-demand-and-pain-points, sources-code-reality-check, sources-live-facts).
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
