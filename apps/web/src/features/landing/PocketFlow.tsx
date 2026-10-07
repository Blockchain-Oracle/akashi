import { ArrowRight } from "lucide-react";

import { ONCHAIN, pocketTx, shortHash } from "@/lib/constants/onchain";

const HOPS = [
  { label: "Your agent", detail: "POST /v1/run/…", mono: "x402 · USDC" },
  { label: "Akashi gateway", detail: "verifies the payment", mono: "settles only on success" },
  { label: "Pocket relay", detail: "signed by Akashi's staked app", mono: `service ${ONCHAIN.serviceId}` },
  { label: "Akashi supplier", detail: "RelayMiner on Pocket Beta", mono: "claims + proofs on chain" },
  { label: "The tool", detail: "Firecrawl, Groq, Wikipedia…", mono: "JSON back in < 9 s" },
] as const;

/** Akashi's own section (not on Monid): how one paid run travels through x402 and Pocket Network. */
export function PocketFlow() {
  return (
    <section className="border-y border-line bg-subtle">
      <div className="mx-auto max-w-[1200px] px-4 py-24 sm:px-6">
        <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-brand uppercase">Native to Pocket Network</p>
        <h2 className="display mt-3 max-w-[760px] text-[clamp(2rem,4.4vw,3.1rem)]">Every paid run is a Pocket relay.</h2>
        <p className="mt-4 max-w-[640px] text-lg text-muted-foreground">
          Payment is the credential. The gateway checks the x402 payment, sends the run as a signed relay to
          Akashi&apos;s supplier, and settles only when a result comes back.
        </p>
        <ol className="mt-14 grid gap-3 md:grid-cols-5">
          {HOPS.map((hop, index) => (
            <li key={hop.label} className="relative rounded-md border border-line bg-background p-4 shadow-card">
              <span className="font-mono text-[0.6875rem] text-muted-foreground">0{index + 1}</span>
              <p className="mt-2 font-semibold">{hop.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{hop.detail}</p>
              <p className="mt-3 font-mono text-[0.75rem] text-brand">{hop.mono}</p>
              {index < HOPS.length - 1 && (
                <ArrowRight
                  className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-subtle text-line-strong md:block"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          {ONCHAIN.serviceId} registered on {ONCHAIN.network} at height {ONCHAIN.registrationHeight.toLocaleString("en-US")} ·{" "}
          <a className="text-brand underline-offset-4 hover:underline" href={pocketTx(ONCHAIN.registrationTx)}>
            tx {shortHash(ONCHAIN.registrationTx)}
          </a>
        </p>
      </div>
    </section>
  );
}
