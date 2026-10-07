import { ArrowUpRight } from "lucide-react";

import type { Receipt } from "@/lib/agent/schemas";
import { formatPrice } from "@/lib/catalog/format";
import { ONCHAIN, shortHash } from "@/lib/constants/onchain";
import { BASESCAN_ADDRESS, BASESCAN_TX, NETWORK_LABEL } from "@/lib/constants/wallet";
import { cn } from "@/lib/utils";

/**
 * The run's receipt (the user's KeeperHub receipt card, in Monid paint): a PAID / NOT CHARGED stamp, what was paid
 * and by whom, the Base Sepolia settlement on Basescan, and how the run reached the tool (a Pocket relay).
 */
export function ReceiptCard({ receipt, endpointId, latencyMs }: { receipt: Receipt; endpointId: string; latencyMs: number }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Tool", <span key="t" className="font-mono">{endpointId}</span>],
    ["Amount", receipt.paid ? `${formatPrice(receipt.priceUsd ?? "0")} USDC` : "$0 — not settled"],
    ["Network", NETWORK_LABEL],
    [
      "Paid by",
      receipt.payer === "demo" ? (
        <span key="p">Akashi demo wallet{receipt.payerAddress ? ` · ${shortHash(receipt.payerAddress)}` : ""}</span>
      ) : receipt.payerAddress ? (
        <a key="p" className="text-brand hover:underline" href={`${BASESCAN_ADDRESS}${receipt.payerAddress}`} target="_blank" rel="noreferrer">
          {shortHash(receipt.payerAddress)}
        </a>
      ) : (
        "your wallet"
      ),
    ],
  ];
  if (receipt.transaction) {
    rows.push([
      "Settlement",
      <a key="s" className="inline-flex items-center gap-0.5 text-brand hover:underline" href={`${BASESCAN_TX}${receipt.transaction}`} target="_blank" rel="noreferrer">
        {shortHash(receipt.transaction)} <ArrowUpRight className="size-3" aria-hidden />
      </a>,
    ]);
  }
  rows.push([
    "Delivered",
    receipt.via === "pocket" ? `Pocket relay · ${ONCHAIN.serviceId} · ${latencyMs} ms` : receipt.via === "direct" ? `Direct (relay unavailable) · ${latencyMs} ms` : `${latencyMs} ms`,
  ]);
  return (
    <div className="relative w-full max-w-[520px] overflow-hidden rounded-md border border-line bg-background shadow-card">
      <span
        className={cn(
          "absolute top-3 right-3 rotate-[-6deg] rounded-sm border-2 px-2 py-0.5 font-mono text-[0.6875rem] font-semibold tracking-[0.14em] uppercase",
          receipt.paid ? "border-success text-success" : "border-line-strong text-muted-foreground",
        )}
      >
        {receipt.paid ? "Paid" : "Not charged"}
      </span>
      <p className="border-b border-dashed border-line-default px-4 py-2.5 font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
        Receipt · x402
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 px-4 py-3 text-[0.8125rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-ink-2">{value}</dd>
          </div>
        ))}
      </dl>
      {receipt.note && <p className="border-t border-line px-4 py-2 text-xs text-muted-foreground">{receipt.note}</p>}
    </div>
  );
}
