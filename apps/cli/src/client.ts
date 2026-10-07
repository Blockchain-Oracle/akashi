import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { decodePaymentResponseHeader, wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

import type { Config } from "./config.js";
import { NETWORK, REQUEST_TIMEOUT_MS } from "./constants.js";

export interface RunReceipt {
  paid: boolean;
  amountAtomic?: string;
  transaction?: string;
  payer?: string;
  network: string;
  via?: string;
}

export interface RunResult {
  status: number;
  body: unknown;
  receipt: RunReceipt;
  ms: number;
}

const JSON_HEADERS = { "content-type": "application/json", accept: "application/json" };

/**
 * Akashi over HTTP. discover / inspect / catalog are free; run pays with x402 from AKASHI_PRIVATE_KEY. The per-call
 * cap is checked before anything is signed, and the session total when a payment is chosen (the signature IS the
 * payment under the exact scheme, so it is counted when signed, like agentic-portal-mcp's budget.ts).
 */
export class Akashi {
  private spent = 0n;
  private payFetch: typeof fetch | null = null;

  constructor(private readonly config: Config) {}

  get address(): string | undefined {
    return this.config.privateKey ? privateKeyToAccount(this.config.privateKey).address : undefined;
  }

  get spentAtomic(): bigint {
    return this.spent;
  }

  private async read(path: string, body?: unknown): Promise<unknown> {
    const res = await fetch(`${this.config.apiUrl}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: JSON_HEADERS,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const parsed = (await res.json()) as unknown;
    if (!res.ok) throw new Error(JSON.stringify(parsed));
    return parsed;
  }

  discover(query: string, limit: number): Promise<unknown> {
    return this.read("/v1/discover", { query, limit });
  }

  inspect(id: string): Promise<unknown> {
    return this.read("/v1/inspect", { id });
  }

  catalog(): Promise<unknown> {
    return this.read("/v1/catalog");
  }

  private paying(): typeof fetch {
    if (this.payFetch) return this.payFetch;
    if (!this.config.privateKey) {
      throw new Error("No wallet: set AKASHI_PRIVATE_KEY to a Base Sepolia key holding test USDC (faucet.circle.com).");
    }
    const { maxAtomicPerCall, maxTotalAtomic } = this.config;
    const choose = <R extends { amount: string; network: string }>(_version: number, options: R[]): R => {
      const option = options.find((o) => o.network === NETWORK && BigInt(o.amount) <= maxAtomicPerCall);
      if (!option) throw new Error(`price above the per-call cap of ${maxAtomicPerCall} atomic units; nothing was signed`);
      if (this.spent + BigInt(option.amount) > maxTotalAtomic) {
        throw new Error(`the session spend limit (${maxTotalAtomic} atomic units) is used up; nothing was signed`);
      }
      this.spent += BigInt(option.amount);
      return option;
    };
    const client = new x402Client(choose);
    registerExactEvmScheme(client, { signer: privateKeyToAccount(this.config.privateKey), paymentRequirementsSelector: choose });
    this.payFetch = wrapFetchWithPayment(fetch, client);
    return this.payFetch;
  }

  async run(id: string, input: unknown): Promise<RunResult> {
    const started = Date.now();
    const res = await this.paying()(`${this.config.apiUrl}/v1/run/${id}`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input ?? {}),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep the raw text
    }
    const header = res.headers.get("PAYMENT-RESPONSE");
    const settle = header ? decodePaymentResponseHeader(header) : null;
    return {
      status: res.status,
      body,
      ms: Date.now() - started,
      receipt: {
        paid: Boolean(settle?.success),
        transaction: settle?.transaction || undefined,
        payer: settle?.payer,
        network: settle?.network ?? NETWORK,
        via: res.headers.get("X-Akashi-Via") ?? undefined,
      },
    };
  }
}
