/**
 * Plain questions about now → a Live Facts call, without a model: the common shapes (time in X, weather in X,
 * USD to EUR, AAPL price, holidays in Japan, news about X, capital of X). Anything else asks the user to pick.
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
