import { chatBudget } from "@/lib/server/chat-ratelimit.server";
import { json } from "@/lib/server/http.server";
import { clientIp } from "@/lib/server/ratelimit.server";

/** The budget sidebar: how many chat turns this IP has left in the window. */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return json(chatBudget(clientIp(req.headers)));
}
