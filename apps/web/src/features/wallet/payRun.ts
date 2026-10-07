import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import type { WalletClient } from "viem";

import { HTTP_PAYMENT_REQUIRED, paymentFailure } from "@/lib/agent/payment-error";
import type { RunResult } from "@/lib/agent/schemas";
import type { CatalogEndpoint } from "@/lib/catalog/types";
import { GATEWAY_URL } from "@/lib/constants/site";
import { ONCHAIN } from "@/lib/constants/onchain";
import { NETWORK_ID, PAY_FETCH_TIMEOUT_MS, USDC_ADDRESS, WALLET_MAX_ATOMIC_PER_CALL } from "@/lib/constants/wallet";

type TypedData = Parameters<WalletClient["signTypedData"]>[0];

const sameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Pay for one run from the visitor's wallet: the gateway answers 402, the wallet signs an EIP-3009 USDC
 * authorization (gasless, no ETH needed), the request is retried with PAYMENT-SIGNATURE, and the gateway settles
 * only if the run succeeds. A price above the per-call cap throws before anything is signed.
 */
export async function payRun(params: {
  wallet: WalletClient;
  address: `0x${string}`;
  endpoint: Pick<CatalogEndpoint, "id" | "path" | "price">;
  input: unknown;
}): Promise<RunResult> {
  const { wallet, address, endpoint, input } = params;
  const started = Date.now();
  // Sign only what the visitor approved: Base Sepolia USDC, to Akashi's pay-to address, at most the displayed price
  // (and never above the per-call cap). A stale catalog or a tampered 402 throws here, before any signature.
  const approvedAtomic = BigInt(endpoint.price.atomic);
  let signedAtomic: string | undefined;
  const withinCap = <R extends { amount: string; network: string; asset: string; payTo: string }>(
    _version: number,
    options: R[],
  ): R => {
    const ok = options.find(
      (o) =>
        o.network === NETWORK_ID &&
        sameAddress(o.asset, USDC_ADDRESS) &&
        sameAddress(o.payTo, ONCHAIN.payTo) &&
        BigInt(o.amount) <= approvedAtomic &&
        BigInt(o.amount) <= WALLET_MAX_ATOMIC_PER_CALL,
    );
    if (!ok) throw new Error("The payment asked for does not match the price shown; nothing was signed.");
    signedAtomic = ok.amount;
    return ok;
  };
  const signer = {
    address,
    signTypedData: (message: { domain: Record<string, unknown>; types: Record<string, unknown>; primaryType: string; message: Record<string, unknown> }) =>
      wallet.signTypedData({ account: address, ...message } as unknown as TypedData),
  };
  const client = new x402Client(withinCap);
  registerExactEvmScheme(client, { signer, paymentRequirementsSelector: withinCap });
  const pay = wrapFetchWithPayment(fetch, client);

  const res = await pay(`${GATEWAY_URL}${endpoint.path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input ?? {}),
    signal: AbortSignal.timeout(PAY_FETCH_TIMEOUT_MS),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep the raw text for the error card
  }
  if (res.status === HTTP_PAYMENT_REQUIRED) body = paymentFailure(res.headers.get("PAYMENT-REQUIRED"));
  const header = res.headers.get("PAYMENT-RESPONSE");
  const settle = header ? decodePaymentResponseHeader(header) : null;
  return {
    id: endpoint.id,
    status: res.status,
    body,
    latency_ms: Date.now() - started,
    receipt: {
      paid: Boolean(settle?.success),
      payer: "wallet",
      network: settle?.network ?? NETWORK_ID,
      amountAtomic: signedAtomic ?? endpoint.price.atomic,
      priceUsd: endpoint.price.usd,
      transaction: settle?.transaction || undefined,
      payerAddress: settle?.payer ?? address,
      via: (res.headers.get("X-Akashi-Via") as "pocket" | "direct" | null) ?? undefined,
      note: settle?.success ? undefined : "Not settled: nothing was charged.",
    },
  };
}
