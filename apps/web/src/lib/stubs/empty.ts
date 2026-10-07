/**
 * Stand-in for optional modules a wallet dependency imports lazily but Akashi never reaches: @coinbase/cdp-sdk
 * (via wagmi's Base Account connector) dynamic-imports `@x402/svm/exact/client` for Solana x402, and Akashi pays
 * on Base Sepolia only. Aliased in next.config.ts so the bundler resolves it.
 */
export {};
