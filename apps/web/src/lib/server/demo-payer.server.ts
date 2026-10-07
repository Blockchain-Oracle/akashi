import "server-only";

import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

import { HTTP_PAYMENT_REQUIRED, paymentFailure } from "@/lib/agent/payment-error";
import type { RunResult } from "@/lib/agent/schemas";
import {
  DEMO_DAILY_BUDGET_ATOMIC,
  DEMO_DAY_S,
  DEMO_MAX_ATOMIC_PER_CALL,
  DEMO_PER_IP_DAILY_ATOMIC,
  RUN_FETCH_TIMEOUT_MS,
} from "@/lib/constants/agent";
import { serverEnv } from "@/lib/server/env.server";

const MS_PER_S = 1000;
const NETWORK = "eip155:84532";
const NOTHING = BigInt(0);

/**
 * Demo mode: Akashi's own Base Sepolia wallet pays the public gateway, so a visitor without a wallet still makes
 * a real x402 payment and a real Pocket relay. Spend is capped per day overall and per visitor (in process memory:
 * one web container), and counted only when the gateway settled (a PAYMENT-RESPONSE came back).
 */
let cachedFetch: typeof fetch | null = null;
const spend = { day: 0, total: NOTHING, perIp: new Map<string, bigint>() };

function today(): number {
  return Math.floor(Date.now() / MS_PER_S / DEMO_DAY_S);
}

function ledger() {
  if (spend.day !== today()) {
    spend.day = today();
    spend.total = NOTHING;
    spend.perIp.clear();
  }
  return spend;
}

function payingFetch(): typeof fetch | null {
  if (cachedFetch) return cachedFetch;
  const key = serverEnv().DEMO_WALLET_PRIVATE_KEY;
  if (!key) return null;
  const withinCap = <R extends { amount: string }>(_version: number, options: R[]): R => {
    const ok = options.find((o) => BigInt(o.amount) <= DEMO_MAX_ATOMIC_PER_CALL);
    if (!ok) throw new Error("The demo wallet does not pay more than $0.01 per call.");
    return ok;
  };
  const client = new x402Client(withinCap);
  registerExactEvmScheme(client, { signer: privateKeyToAccount(key as `0x${string}`), paymentRequirementsSelector: withinCap });
  cachedFetch = wrapFetchWithPayment(fetch, client);
  return cachedFetch;
}

export function demoAddress(): string | undefined {
  const key = serverEnv().DEMO_WALLET_PRIVATE_KEY;
  return key ? privateKeyToAccount(key as `0x${string}`).address : undefined;
}

export async function demoRun(id: string, path: string, input: unknown, priceAtomic: bigint, ip: string): Promise<RunResult> {
  const started = Date.now();
  const base = { id, latency_ms: 0 };
  const pay = payingFetch();
  const book = ledger();
  const usedByIp = book.perIp.get(ip) ?? NOTHING;
  const refuse = (note: string): RunResult => ({
    ...base,
    status: 402,
    body: { error: { code: "demo_unavailable", message: note, retryable: false } },
    receipt: { paid: false, payer: "demo", network: NETWORK, note },
  });
  if (!pay) return refuse("Demo runs are off on this server (no demo wallet). Switch to your own wallet to pay.");
  if (book.total + priceAtomic > DEMO_DAILY_BUDGET_ATOMIC) return refuse("Today's demo budget is used up. Pay with your own wallet to keep going.");
  if (usedByIp + priceAtomic > DEMO_PER_IP_DAILY_ATOMIC) return refuse("You've used today's demo credit. Pay with your own wallet to keep going.");

  let res: Response;
  try {
    res = await pay(`${serverEnv().AKASHI_GATEWAY_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input ?? {}),
      signal: AbortSignal.timeout(RUN_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...refuse(`The demo payment did not go through: ${message}`), latency_ms: Date.now() - started };
  }
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep the raw text: the UI shows it as an error
  }
  if (res.status === HTTP_PAYMENT_REQUIRED) body = paymentFailure(res.headers.get("PAYMENT-REQUIRED"));
  const header = res.headers.get("PAYMENT-RESPONSE");
  const settle = header ? decodePaymentResponseHeader(header) : null;
  if (settle?.success) {
    book.total += priceAtomic;
    book.perIp.set(ip, usedByIp + priceAtomic);
  }
  return {
    ...base,
    status: res.status,
    body,
    latency_ms: Date.now() - started,
    receipt: {
      paid: Boolean(settle?.success),
      payer: "demo",
      network: settle?.network ?? NETWORK,
      amountAtomic: priceAtomic.toString(),
      transaction: settle?.transaction || undefined,
      payerAddress: settle?.payer ?? demoAddress(),
      via: (res.headers.get("X-Akashi-Via") as "pocket" | "direct" | null) ?? undefined,
      note: settle?.success ? undefined : "Not settled: nothing was charged.",
    },
  };
}
