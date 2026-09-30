import { z } from "zod";

import { PICKABLE_KINDS } from "@/features/desk/now-intent";
import { planDesk } from "@/features/desk/plan";
import { DEMO_LIMIT_PER_IP, DEMO_WINDOW_S, MAX_REQUEST_BYTES } from "@/lib/constants/desk";
import { callBackend } from "@/lib/server/backend.server";
import { clientIp, takeDemoSlot } from "@/lib/server/ratelimit.server";

/**
 * The free demo: route the input, fan it out one call per item, and stream NDJSON as each item resolves:
 *   {type:"route"} then {type:"item"} × n, then {type:"done"}.
 */
export const dynamic = "force-dynamic";

const HTTP_BAD_REQUEST = 400;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY = 429;

const Body = z.object({
  input: z.string().max(MAX_REQUEST_BYTES),
  mode: z.enum(["auto", "cite", "code", "now"]).default("auto"),
  kind: z.enum(PICKABLE_KINDS).optional(),
});

const error = (status: number, code: string, message: string, extra: Record<string, unknown> = {}) =>
  Response.json({ error: { code, message, retryable: false, ...extra } }, { status });

export async function POST(req: Request) {
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_REQUEST_BYTES) {
    return error(HTTP_PAYLOAD_TOO_LARGE, "payload_too_large", "Up to 64 KiB at a time.");
  }
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(JSON.parse(raw));
  } catch {
    return error(HTTP_BAD_REQUEST, "invalid_input", "Send {input, mode}.");
  }

  const planned = planDesk(parsed.input, parsed.mode, parsed.kind);
  if (!planned.ok) return error(HTTP_UNPROCESSABLE, planned.code, planned.message);

  const slot = takeDemoSlot(clientIp(req.headers), DEMO_LIMIT_PER_IP, DEMO_WINDOW_S);
  if (!slot.ok) {
    return error(HTTP_TOO_MANY, "demo_rate_limited", "The free demo allows a few checks an hour.", {
      retry_after_s: slot.retryAfterS,
      limit: DEMO_LIMIT_PER_IP,
      window_s: DEMO_WINDOW_S,
    });
  }

  const { service, items } = planned.plan;
  const started = Date.now();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
      send({ type: "route", service, labels: items.map((i) => i.label) });
      await Promise.all(
        items.map(async (item, index) => {
          const result = await callBackend(service, item.path, item.body);
          send({ type: "item", index, ok: result.ok, status: result.status, body: result.body });
        }),
      );
      send({ type: "done", elapsed_ms: Date.now() - started });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}
