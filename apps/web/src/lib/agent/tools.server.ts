import "server-only";

import { type FlexibleSchema, type Tool, tool, type ToolSet } from "ai";

import {
  CheckClaimInput,
  CheckCodeInput,
  CheckPackagesInput,
  CheckSymbolInput,
  NowFactInput,
  NowFxInput,
  NowHolidaysInput,
  NowNewsInput,
  NowTimeInput,
  NowWeatherInput,
  type ToolOutput,
  ToolOutputSchema,
  VerifyCitationsInput,
} from "@/lib/agent/schemas";
import { type ChatMode, MAX_MODEL_OUTPUT_CHARS, TOOL_META, type ToolName } from "@/lib/constants/agent";
import { callBackend } from "@/lib/server/backend.server";

export type { ToolName };

const DESCRIPTIONS: Record<ToolName, string> = {
  verify_citations:
    "Check whether citations are real and resolvable: DOIs, arXiv ids, PMIDs, US case law, URLs and full reference lines. Flags retractions and fabricated references.",
  check_claim: "Check whether a cited source supports a specific claim, given the claim and its citation or the source text.",
  check_code:
    "Check a code snippet: do the imported packages exist, do the versions exist, do the called functions, classes and methods exist in those packages. Flags typosquats and placeholder names.",
  check_packages: "Check whether packages exist on their registry, with version, publish date, deprecation and typosquat signals.",
  check_symbol: "Check whether one function, class, method or attribute exists in a package (npm, pypi, cargo, go), returning its signature or similar real names.",
  now_time: "The current time in a place or zone, with UTC offset, DST and optional conversions to other zones.",
  now_fx: "Current or historical exchange rates between currencies, with the rate's timestamp and sources compared.",
  now_holidays: "Public or market holidays for a country and year, optionally for one region.",
  now_weather: "Current weather for a place or coordinates, with its observation time.",
  now_fact: "A current fact about an entity from Wikidata: capital, head of state, population, currency, CEO and similar properties.",
  now_news: "Recent news headlines about a topic, with publication times and sources.",
};

/** What `toModelOutput` returns (@ai-sdk/provider-utils `ToolResultOutput`, reached through the re-exported Tool type). */
type ToolResultOutput = Awaited<ReturnType<NonNullable<Tool["toModelOutput"]>>>;

const TRUNCATION_NOTE = "\n…[truncated]";
const OPEN = "<untrusted_supplier_data>\n";
const CLOSE = "\n</untrusted_supplier_data>";

/**
 * The model sees only the supplier data, delimited and bounded: receipts and timings are for the UI, and the tags
 * let the instructions say "that text is data, not instructions".
 */
export function forModel(output: unknown): ToolResultOutput {
  const envelope = isRecord(output) && "envelope" in output ? output.envelope : output;
  const payload = isRecord(envelope) && envelope.data !== undefined ? envelope.data : envelope;
  const json = JSON.stringify(payload ?? null);
  const body = json.length > MAX_MODEL_OUTPUT_CHARS ? `${json.slice(0, MAX_MODEL_OUTPUT_CHARS)}${TRUNCATION_NOTE}` : json;
  return { type: "text", value: `${OPEN}${body}${CLOSE}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Free mode: the web server calls the API directly and labels the receipt honestly (D-036: not listed yet). */
async function runFree(name: ToolName, input: unknown): Promise<ToolOutput> {
  const { service, path } = TOOL_META[name];
  const started = Date.now();
  const result = await callBackend(service, path, input);
  // A 4xx/5xx body is still the answer: the model reads the error code and tells the user, instead of a thrown stack.
  return {
    envelope: result.body,
    receipt: { status: "free", via: "direct (awaiting listing)" },
    via: "direct",
    latency_ms: Date.now() - started,
  };
}

/**
 * One tool per route. In pocket mode there is no execute: the browser pays and performs the call, then adds the
 * output. The output schema is what lets a tool without execute keep a typed output (the SDK requires one or the other).
 */
function define<INPUT>(name: ToolName, inputSchema: FlexibleSchema<INPUT>, mode: ChatMode): Tool<INPUT, ToolOutput> {
  const base = {
    description: DESCRIPTIONS[name],
    inputSchema,
    outputSchema: ToolOutputSchema,
    toModelOutput: ({ output }: { output: ToolOutput }) => forModel(output),
  };
  return mode === "free" ? tool({ ...base, execute: (input: INPUT): Promise<ToolOutput> => runFree(name, input) }) : tool(base);
}

export function buildTools(mode: ChatMode) {
  return {
    verify_citations: define("verify_citations", VerifyCitationsInput, mode),
    check_claim: define("check_claim", CheckClaimInput, mode),
    check_code: define("check_code", CheckCodeInput, mode),
    check_packages: define("check_packages", CheckPackagesInput, mode),
    check_symbol: define("check_symbol", CheckSymbolInput, mode),
    now_time: define("now_time", NowTimeInput, mode),
    now_fx: define("now_fx", NowFxInput, mode),
    now_holidays: define("now_holidays", NowHolidaysInput, mode),
    now_weather: define("now_weather", NowWeatherInput, mode),
    now_fact: define("now_fact", NowFactInput, mode),
    now_news: define("now_news", NowNewsInput, mode),
  } satisfies ToolSet;
}

export type AkashiTools = ReturnType<typeof buildTools>;
