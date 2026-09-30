// 21st.dev Receipt Tiers (29978, "Straight" variant), adapted to one slip: brand tokens instead of its 18 colours,
// a masked torn edge (styles/index.css .receipt), and the 証 seal as the rubber stamp.
import { Seal } from "@akashi/brand/react";
import { ONCHAIN } from "@akashi/ui/onchain";

import { PRICE_USDC } from "@/lib/constants/services";
import { RECEIPT_LINES, RECEIPT_WAIVERS } from "@/lib/constants/story";

function Rule() {
  return <span aria-hidden className="my-4 block border-t border-dashed border-border" />;
}

function Line({ item, value }: { item: string; value: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="shrink-0 uppercase">{item}</span>
      <span aria-hidden className="mb-1 min-w-3 flex-1 border-b border-dotted border-border" />
      <span className="shrink-0 text-muted-foreground">{value}</span>
    </li>
  );
}

/** What one check costs on the Agentic Portal, printed as a receipt: the only drop shadow in the app. */
export function PriceReceipt() {
  return (
    <div className="receipt mx-auto w-full max-w-sm">
      <div className="receipt-paper bg-card px-7 pt-8 font-mono text-xs leading-relaxed">
        <p className="text-center text-sm font-semibold tracking-widest uppercase">証 Akashi</p>
        <p className="mt-1 text-center text-[11px] tracking-wider text-muted-foreground uppercase">
          Pocket Network · Agentic Portal
        </p>
        <Rule />
        <ul className="space-y-1.5">
          {RECEIPT_LINES.map(([item, value]) => (
            <Line key={`${item}-${value}`} item={item} value={value} />
          ))}
        </ul>
        <Rule />
        <ul className="space-y-1.5">
          {RECEIPT_WAIVERS.map(([item, value]) => (
            <Line key={item} item={item} value={value} />
          ))}
        </ul>
        <Rule />
        <p className="flex items-baseline justify-between text-base font-semibold">
          <span className="uppercase">Per check</span>
          <span>${PRICE_USDC}</span>
        </p>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div aria-hidden className="receipt-barcode h-9 opacity-70" />
            <p className="mt-2 text-[11px] tracking-widest text-muted-foreground uppercase">
              Beta · block {ONCHAIN.services.cite.height.toLocaleString("en-US")}
            </p>
          </div>
          <Seal className="size-16 shrink-0 -rotate-12 opacity-85 mix-blend-multiply dark:mix-blend-normal" label={null} />
        </div>
      </div>
    </div>
  );
}
