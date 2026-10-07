/** Turns a failed x402 attempt (the gateway still answering 402 after a payment) into a readable error body. */
const KNOWN: Record<string, string> = {
  insufficient_funds: "The paying wallet does not have enough test USDC on Base Sepolia (faucet.circle.com).",
  invalid_exact_evm_payload_signature: "The payment signature was rejected.",
  invalid_exact_evm_payload_authorization_valid_before: "The payment authorization expired before it was used.",
};

export const HTTP_PAYMENT_REQUIRED = 402;

export function paymentFailure(header: string | null): { error: { code: string; message: string; retryable: boolean } } {
  let reason = "payment_failed";
  try {
    if (header) {
      const decoded = JSON.parse(atob(header)) as { error?: string };
      if (decoded.error) reason = decoded.error;
    }
  } catch {
    // keep the generic reason
  }
  return {
    error: {
      code: "payment_failed",
      message: KNOWN[reason] ?? `The payment was not accepted (${reason}). Nothing was charged.`,
      retryable: false,
    },
  };
}
