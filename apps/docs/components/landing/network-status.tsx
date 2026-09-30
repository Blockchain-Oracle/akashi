import { SERVICE_ORDER, SERVICES } from "@akashi/brand";

import { site } from "@/lib/site";

const HEALTH_TIMEOUT_MS = 2_500;
const REVALIDATE_S = 60;

async function up(prefix: string): Promise<boolean> {
  try {
    const res = await fetch(`${site.api}${prefix}/v1/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** A live pill: the three services' health, checked by the docs server every minute. */
export async function NetworkStatus({ className }: { className?: string }) {
  const results = await Promise.all(SERVICE_ORDER.map((key) => up(SERVICES[key].prefix)));
  const live = results.filter(Boolean).length;
  const all = live === results.length;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1 font-mono text-xs text-fd-muted-foreground ${className ?? ""}`}
    >
      <span className={`size-1.5 rounded-full ${all ? "bg-verdict-verified" : "bg-verdict-mismatch"}`} aria-hidden />
      {all ? "All three services live" : `${live} of ${results.length} services live`} · registered on Pocket Network
      Beta
    </div>
  );
}
