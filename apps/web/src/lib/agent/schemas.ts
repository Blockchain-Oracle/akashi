/**
 * Tool inputs, one flat zod object per backend route (specs/web.md §7). Flat on purpose: OpenAI's strict mode rejects
 * oneOf/anyOf, so the generated request unions are narrowed to their common shape and `satisfies` keeps each schema
 * honest against the OpenAPI type it posts as.
 */
import type { CiteSchemas, CodeSchemas, NowSchemas } from "@akashi/api-client";
import { z } from "zod";

import { MAX_SNIPPET_CHARS } from "@/lib/constants/agent";
import { MAX_CITATIONS_PER_RUN, MAX_PACKAGES_PER_RUN } from "@/lib/constants/desk";

const CHECK_LANGUAGES = ["python", "typescript", "javascript", "go", "rust"] as const satisfies readonly CodeSchemas["CheckLanguage"][];
const ECOSYSTEMS = ["npm", "pypi", "cargo", "go", "maven", "rubygems", "packagist", "nuget"] as const satisfies readonly CodeSchemas["Ecosystem"][];
// /v1/symbol reads type definitions and source, which the index has for these four only.
const SYMBOL_ECOSYSTEMS = ["npm", "pypi", "cargo", "go"] as const satisfies readonly CodeSchemas["Ecosystem"][];

const ISO_COUNTRY_CHARS = 2;
const ISO_CURRENCY_CHARS = 3;
// The Live Facts defaults (packages/now), repeated so the model may leave them out.
const NEWS_DEFAULT_SINCE_HOURS = 24;
const NEWS_DEFAULT_LIMIT = 10;

const ISO_COUNTRY = z.string().length(ISO_COUNTRY_CHARS).describe("ISO 3166-1 alpha-2 country code, e.g. US, JP, MA");
const ISO_CURRENCY = z.string().length(ISO_CURRENCY_CHARS).describe("ISO 4217 currency code, e.g. USD");

export const VerifyCitationsInput = z.object({
  citations: z
    .array(z.string().min(1).describe("One citation as written: a DOI, arXiv id, PMID, case citation, URL or a full reference line"))
    .min(1)
    .max(MAX_CITATIONS_PER_RUN)
    .describe(`The citations to verify, one string each, up to ${MAX_CITATIONS_PER_RUN}`),
}) satisfies z.ZodType<CiteSchemas["VerifyRequest"]>;

export const CheckClaimInput = z.object({
  claim: z.string().min(1).describe("The statement the source is said to support, in one sentence"),
  citation: z.string().optional().describe("The citation the claim is attributed to (DOI, case, URL or reference line)"),
  evidence_text: z.string().optional().describe("Text from the source itself, when the user pasted it"),
}) satisfies z.ZodType<CiteSchemas["ClaimRequest"]>;

export const CheckCodeInput = z.object({
  language: z.enum(CHECK_LANGUAGES).describe("The snippet's language"),
  code: z.string().min(1).max(MAX_SNIPPET_CHARS).describe("The snippet exactly as the user wrote it"),
}) satisfies z.ZodType<CodeSchemas["CheckRequest"]>;

export const CheckPackagesInput = z.object({
  items: z
    .array(
      z.object({
        ecosystem: z.enum(ECOSYSTEMS).describe("The registry the package would be installed from"),
        name: z.string().min(1).describe("The package name exactly as it would be installed"),
        version: z.string().optional().describe("A version or range when the user gave one"),
      }),
    )
    .min(1)
    .max(MAX_PACKAGES_PER_RUN)
    .describe(`Packages to look up, up to ${MAX_PACKAGES_PER_RUN}`),
}) satisfies z.ZodType<CodeSchemas["PackagesRequest"]>;

export const CheckSymbolInput = z.object({
  ecosystem: z.enum(SYMBOL_ECOSYSTEMS).describe("The package's registry"),
  package: z.string().min(1).describe("The package that should export the symbol"),
  version: z.string().optional().describe("The package version when the user pinned one"),
  symbol: z.string().min(1).describe("The function, class, method or attribute, dotted for members, e.g. axios.fetchJson"),
}) satisfies z.ZodType<CodeSchemas["SymbolQuery"]>;

export const NowTimeInput = z.object({
  place: z.string().optional().describe("A city or country name, e.g. Casablanca"),
  zone: z.string().optional().describe("An IANA zone when known, e.g. Africa/Casablanca"),
  country: ISO_COUNTRY.optional().describe("ISO 3166-1 alpha-2 hint when the place name is ambiguous"),
  at: z.string().optional().describe("The instant to evaluate as ISO 8601; omit for now"),
  convert_to: z.array(z.string()).optional().describe("Other zones or places to show the same instant in"),
}) satisfies z.ZodType<NowSchemas["TimeRequest"]>;

export const NowFxInput = z.object({
  base: ISO_CURRENCY,
  quotes: z.array(ISO_CURRENCY).min(1).describe("Currencies to quote the base in"),
  amount: z.number().optional().describe("An amount of the base currency to convert"),
  date: z.string().optional().describe("A past date as YYYY-MM-DD; omit for the latest rate"),
}) satisfies z.ZodType<NowSchemas["FxRequest"]>;

export const NowHolidaysInput = z.object({
  country: ISO_COUNTRY,
  year: z.number().int().describe("The calendar year"),
  subdivision: z.string().optional().describe("A region code when holidays differ by region, e.g. BY, CA"),
  calendar: z.string().default("public").describe("'public', or a market calendar such as NYSE, ECB or LSE"),
}) satisfies z.ZodType<NowSchemas["HolidaysRequest"]>;

export const NowWeatherInput = z.object({
  place: z.string().optional().describe("A city or place name"),
  lat: z.number().optional().describe("Latitude when the user gave coordinates"),
  lon: z.number().optional().describe("Longitude when the user gave coordinates"),
}) satisfies z.ZodType<NowSchemas["WeatherRequest"]>;

export const NowFactInput = z.object({
  subject: z.string().min(1).describe("The entity, as a name or Wikidata QID, e.g. Japan or Q17"),
  property: z
    .string()
    .min(1)
    .describe("What is asked about it: capital, head of state, head of government, population, currency, CEO, mayor, official language, or a Wikidata PID"),
}) satisfies z.ZodType<NowSchemas["FactRequest"]>;

export const NowNewsInput = z.object({
  query: z.string().min(1).describe("The topic, name or phrase to search the news for"),
  since_hours: z.number().int().default(NEWS_DEFAULT_SINCE_HOURS).describe("How far back to look, in hours"),
  country: ISO_COUNTRY.optional().describe("Restrict to news mentioning this country"),
  limit: z.number().int().default(NEWS_DEFAULT_LIMIT).describe("How many headlines to return"),
}) satisfies z.ZodType<NowSchemas["NewsRequest"]>;

/**
 * What every tool returns to the UI and the transcript: the Akashi envelope (an error body on 4xx/5xx, so the model
 * can say what went wrong) plus how the call was paid for. Old outputs trimmed from a long transcript become
 * `{ trimmed: true }`, which the schema accepts so validateUIMessages keeps the history. A union is fine here: output
 * schemas are never sent to the model.
 */
export const ToolOutputSchema = z.union([
  z.object({
    envelope: z.unknown(),
    receipt: z.looseObject({ status: z.enum(["free", "paid"]), via: z.string().optional() }),
    via: z.enum(["direct", "pocket"]),
    latency_ms: z.number(),
  }),
  z.object({ trimmed: z.literal(true) }),
]);
export type ToolOutput = z.infer<typeof ToolOutputSchema>;
