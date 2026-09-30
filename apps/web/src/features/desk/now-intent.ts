/**
 * Plain questions about now → a Live Facts call, without a model: the common shapes (time in X, weather in X,
 * USD to EUR, AAPL price, holidays in Japan, news about X, capital of X). Anything else asks the user to pick a kind,
 * and the question's subject becomes that kind's input (nowForKind).
 */
export type NowEndpoint = "time" | "fx" | "weather" | "holidays" | "stocks" | "news" | "fact" | "jobs";
export interface NowCall {
  endpoint: NowEndpoint;
  body: Record<string, unknown>;
  label: string;
}

const FX = /\b([A-Za-z]{3})\s*(?:to|→|->|in|into|\/|vs\.?)\s*([A-Za-z]{3})\b/i;
const AMOUNT = /\b(\d+(?:[.,]\d+)?)\s*[A-Za-z]{3}\b/;
const TIME = /\b(?:time|clock)\b.*?\b(?:in|at|for)\s+([^?.!]+)/i;
const WEATHER = /\b(?:weather|temperature|forecast|raining|rain)\b.*?\b(?:in|at|for)\s+([^?.!]+)/i;
const HOLIDAYS = /\bholidays?\b.*?\b(?:in|for)\s+([^?.!]+)/i;
const TICKER = /\$?\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?)\b\s*(?:stock|share|shares|price|quote)\b|\b(?:stock|share|price|quote)\s+(?:of\s+)?\$?([A-Z]{1,5})\b/;
const NEWS = /\bnews\b(?:\s+(?:about|on|for))?\s+([^?.!]+)/i;
const JOBS = /\bjobs?\b.*?\b(?:at|for)\s+([^?.!]+)/i;
// Only aliases /v1/fact accepts (packages/now facts/properties.py).
const FACT = /\b(capital|president|prime minister|head of state|head of government|ceo|population|currency|mayor|official language)\s+of\s+(?:the\s+)?([^?.!]+)/i;

const ISO_REGIONS: [string, string][] = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const out: [string, string][] = [];
  const A = 65;
  const LETTERS = 26;
  for (let i = 0; i < LETTERS; i++) {
    for (let j = 0; j < LETTERS; j++) {
      const code = String.fromCharCode(A + i, A + j);
      const name = names.of(code);
      if (name && name !== code) out.push([name.toLowerCase(), code]);
    }
  }
  return out;
})();

function countryCode(text: string): string | null {
  const t = text.trim().toLowerCase().replace(/^the\s+/, "");
  if (/^[a-z]{2}$/.test(t)) return t.toUpperCase();
  return ISO_REGIONS.find(([name]) => name === t)?.[1] ?? null;
}

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const TICKER_ONLY = /^\$?([A-Z]{1,5}(?:\.[A-Z]{1,2})?)$/;

// Real ISO 4217 codes only, so "fly to Rio" is not FLY → RIO.
const CURRENCIES = new Set(Intl.supportedValuesOf("currency"));

export function nowIntent(question: string): NowCall | null {
  const q = question.trim();
  const fx = FX.exec(q);
  if (fx?.[1] && fx[2] && CURRENCIES.has(fx[1].toUpperCase()) && CURRENCIES.has(fx[2].toUpperCase())) {
    const amount = AMOUNT.exec(q)?.[1];
    const base = fx[1].toUpperCase();
    const quote = fx[2].toUpperCase();
    return {
      endpoint: "fx",
      body: { base, quotes: [quote], ...(amount ? { amount: Number(amount.replace(",", ".")) } : {}) },
      label: `${base} → ${quote}`,
    };
  }
  const time = TIME.exec(q);
  if (time?.[1]) return { endpoint: "time", body: { place: clean(time[1]) }, label: `Time in ${clean(time[1])}` };
  const weather = WEATHER.exec(q);
  if (weather?.[1]) return { endpoint: "weather", body: { place: clean(weather[1]) }, label: `Weather in ${clean(weather[1])}` };
  const holidays = HOLIDAYS.exec(q);
  const country = holidays?.[1] ? countryCode(holidays[1]) : null;
  if (country) return { endpoint: "holidays", body: { country, year: new Date().getUTCFullYear() }, label: `Holidays in ${country}` };
  const ticker = TICKER.exec(q);
  const symbol = ticker?.[1] ?? ticker?.[2];
  if (symbol) return { endpoint: "stocks", body: { symbols: [symbol] }, label: `${symbol} quote` };
  const fact = FACT.exec(q);
  if (fact?.[1] && fact[2]) return { endpoint: "fact", body: { subject: clean(fact[2]), property: fact[1].toLowerCase() }, label: `${fact[1]} of ${clean(fact[2])}` };
  const news = NEWS.exec(q);
  if (news?.[1]) return { endpoint: "news", body: { query: clean(news[1]) }, label: `News: ${clean(news[1])}` };
  const jobs = JOBS.exec(q);
  if (jobs?.[1]) return { endpoint: "jobs", body: { query: clean(jobs[1]) }, label: `Jobs: ${clean(jobs[1])}` };
  return null;
}

/** Kinds a user can pick for a question the router could not place: each takes one free-text subject. */
export const PICKABLE_KINDS = ["time", "weather", "holidays", "stocks", "news", "jobs"] as const;
export type PickableKind = (typeof PICKABLE_KINDS)[number];
export const KIND_LABELS: Record<PickableKind, string> = {
  time: "Time",
  weather: "Weather",
  holidays: "Holidays",
  stocks: "Stock",
  news: "News",
  jobs: "Jobs",
};

const AFTER_PREPOSITION = /\b(?:in|at|for|about|on|with)\s+([^?.!]+?)\s*[?.!]*$/i;
const TRAILING_NAME = /((?:\p{Lu}[\p{L}'’-]*\s*)+)[?.!]*$/u;
const PROPER_NAMES = /\p{Lu}[\p{L}'’-]*(?:\s+\p{Lu}[\p{L}'’-]*)*/gu;
const TRAILING_WHEN = /\s+(?:right\s+now|now|today|currently|at\s+the\s+moment|this\s+(?:week|year))$/i;
const QUESTION_LEAD = /^(?:what(?:'s|\s+is|\s+are)?|how(?:'s|\s+is|\s+are)?|is\s+it|are\s+there|tell\s+me|show\s+me|any)\s+/i;

/** The thing a question is about: after its last preposition, else its trailing proper name, else the question. */
function subjectOf(question: string, preferName: boolean): string | null {
  const q = question.trim();
  const after = AFTER_PREPOSITION.exec(q)?.[1];
  const name = preferName ? TRAILING_NAME.exec(q)?.[1] : undefined;
  const subject = clean((after ?? name ?? q.replace(QUESTION_LEAD, "")).replace(/[?.!]+$/, "")).replace(TRAILING_WHEN, "");
  return subject || null;
}

/** The call for a question the user tagged with a kind, or null (with the reason) when it has no usable subject. */
export function nowForKind(kind: PickableKind, question: string): { call: NowCall } | { reason: string } {
  const direct = nowIntent(question);
  if (direct?.endpoint === kind) return { call: direct };
  const place = kind === "time" || kind === "weather";
  const subject = subjectOf(question, place);
  if (!subject) return { reason: "Add what you are asking about." };
  if (place) return { call: { endpoint: kind, body: { place: subject }, label: `${KIND_LABELS[kind]} in ${subject}` } };
  if (kind === "holidays") {
    const names = question.match(PROPER_NAMES) ?? [];
    const country = [subject, ...names].map(countryCode).find(Boolean);
    if (!country) return { reason: "Holidays need a country, e.g. Japan or JP." };
    return { call: { endpoint: kind, body: { country, year: new Date().getUTCFullYear() }, label: `Holidays in ${country}` } };
  }
  if (kind === "stocks") {
    const symbol = TICKER_ONLY.exec(subject.toUpperCase())?.[1];
    if (!symbol) return { reason: "Stocks need a US ticker, e.g. AAPL or BRK.B." };
    return { call: { endpoint: kind, body: { symbols: [symbol] }, label: `${symbol} quote` } };
  }
  return { call: { endpoint: kind, body: { query: subject }, label: `${KIND_LABELS[kind]}: ${subject}` } };
}
