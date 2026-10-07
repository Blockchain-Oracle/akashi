"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useReadContract, useSwitchChain, useWalletClient } from "wagmi";

import { ProviderLogo } from "@/components/common/ProviderLogo";
import type { RunResult } from "@/lib/agent/schemas";
import { formatPrice } from "@/lib/catalog/format";
import { ONCHAIN, shortHash } from "@/lib/constants/onchain";
import { DECLINED_STATUS, NETWORK_LABEL, USDC_ADDRESS, USDC_DECIMALS, USDC_FAUCET_URL } from "@/lib/constants/wallet";
import { cn } from "@/lib/utils";

import { PAY_CHAIN } from "../wallet/wagmi";
import { payRun } from "../wallet/payRun";
import { useEndpoint } from "./endpoints-context";

type Phase = "idle" | "switching" | "signing" | "failed";

const DECLINED: (id: string) => RunResult = (id) => ({
  id,
  status: DECLINED_STATUS,
  body: { error: { code: "declined", message: "The user declined to pay for this run.", retryable: false } },
  receipt: { paid: false, payer: "wallet", network: "eip155:84532", note: "Declined: nothing was signed." },
  latency_ms: 0,
});

/**
 * The inline x402 gateway (Portaldot's TransferCard flow, DeepBookie's states): the run the agent proposed, its
 * price and where the money goes; Pay connects the wallet if needed, switches to Base Sepolia, asks for one EIP-3009
 * signature, runs the tool through the gateway, and hands the result back to the chat.
 */
export function PayCard({ input, onDone }: { input: Record<string, unknown>; onDone: (output: RunResult) => void }) {
  const id = String(input.id ?? "");
  const endpoint = useEndpoint(id);
  const { address, chainId, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const balance = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: PAY_CHAIN.id,
    query: { enabled: Boolean(address) },
  });

  if (!endpoint) {
    return <p className="text-sm text-muted-foreground">The agent asked for an unknown tool ({id}); nothing to pay.</p>;
  }
  const price = BigInt(endpoint.price.atomic);
  const short = balance.data !== undefined && balance.data < price;

  const pay = async () => {
    setError(null);
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    try {
      if (chainId !== PAY_CHAIN.id) {
        setPhase("switching");
        await switchChainAsync({ chainId: PAY_CHAIN.id });
      }
      if (!wallet) throw new Error("The wallet is still connecting; try again in a second.");
      setPhase("signing");
      const output = await payRun({ wallet, address, endpoint, input: input.input ?? {} });
      onDone(output);
    } catch (e) {
      setPhase("failed");
      setError(e instanceof Error ? e.message.split("\n")[0] ?? "Payment failed." : "Payment failed.");
    }
  };

  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-md border border-line bg-background shadow-card">
      <div className="flex items-center justify-between border-b border-line bg-subtle px-4 py-2.5">
        <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
          {phase === "signing" ? "Awaiting signature" : "Payment required · x402"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2 py-0.5 font-mono text-[0.6875rem] text-ink-2">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden /> {NETWORK_LABEL}
        </span>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <ProviderLogo id={endpoint.provider} name={endpoint.providerName} size="md" />
          <div className="min-w-0">
            <p className="font-semibold">{endpoint.displayName}</p>
            <p className="font-mono text-xs text-muted-foreground">{endpoint.id}</p>
          </div>
          <p className="ml-auto text-right">
            <span className="block font-mono text-lg font-semibold">{formatPrice(endpoint.price.usd)}</span>
            <span className="font-mono text-[0.6875rem] text-muted-foreground">USDC</span>
          </p>
        </div>
        <pre className="max-h-40 overflow-auto rounded-sm bg-subtle p-3 font-mono text-[0.75rem] text-ink-2">
          {JSON.stringify(input.input ?? {}, null, 2)}
        </pre>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-[0.75rem]">
          <dt className="text-muted-foreground">Pay to</dt>
          <dd className="truncate text-ink-2">{shortHash(ONCHAIN.payTo)}</dd>
          <dt className="text-muted-foreground">Delivered as</dt>
          <dd className="text-ink-2">Pocket relay · {ONCHAIN.serviceId}</dd>
          {address && (
            <>
              <dt className="text-muted-foreground">Your USDC</dt>
              <dd className={cn("text-ink-2", short && "text-destructive")}>
                {balance.data === undefined ? "…" : `$${formatUnits(balance.data, USDC_DECIMALS)}`}
              </dd>
            </>
          )}
        </dl>
        {short && (
          <p className="text-sm text-destructive">
            Not enough test USDC.{" "}
            <a href={USDC_FAUCET_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Get some from Circle&apos;s faucet
            </a>{" "}
            (Base Sepolia, no ETH needed).
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" aria-hidden /> Settled only if the run succeeds
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDone(DECLINED(id))}
              disabled={phase === "signing" || phase === "switching"}
              className="h-9 rounded-md px-3 text-sm text-ink-2 hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={pay}
              disabled={phase === "signing" || phase === "switching" || short}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-primary-foreground hover:bg-brand-hover active:bg-brand-press disabled:opacity-60"
            >
              {phase === "signing" || phase === "switching" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Wallet className="size-4" aria-hidden />
              )}
              {!isConnected
                ? "Connect wallet"
                : phase === "switching"
                  ? `Switching to ${NETWORK_LABEL}`
                  : phase === "signing"
                    ? "Confirm in your wallet"
                    : `Pay ${formatPrice(endpoint.price.usd)} & run`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
