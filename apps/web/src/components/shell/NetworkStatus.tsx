import { SERVICE_ORDER, SERVICES } from "@akashi/brand";

import { serverEnv } from "@/lib/server/env.server";
import { cn } from "@/lib/utils";

const HEALTH_TIMEOUT_MS = 2_500;
const REVALIDATE_S = 60;

async function up(prefix: string): Promise<boolean> {
  try {
    const res = await fetch(`${serverEnv().AKASHI_API_URL}${prefix}/v1/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** The three services' health as a status pill, checked by the server every minute. */
export async function NetworkStatus({ className }: { className?: string }) {
  const results = await Promise.all(SERVICE_ORDER.map((key) => up(SERVICES[key].prefix)));
  const live = results.filter(Boolean).length;
  const all = live === results.length;
  return (
    <span className={cn("pill", all ? "pill-signal" : "pill-warn", className)}>
      <span className="tabular-nums">
        {live}/{results.length}
      </span>
      live on Pocket Beta
    </span>
  );
}
