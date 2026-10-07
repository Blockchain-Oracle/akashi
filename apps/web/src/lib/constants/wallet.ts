/** Base Sepolia USDC (context/05-external-libs/x402.md; the 402's own `asset` is what is signed). */
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;
export const USDC_FAUCET_URL = "https://faucet.circle.com";
export const BASESCAN_TX = "https://sepolia.basescan.org/tx/";
export const BASESCAN_ADDRESS = "https://sepolia.basescan.org/address/";
/** The wallet never signs more than this per call (USDC atomic units): the catalog's highest price is $0.01. */
export const WALLET_MAX_ATOMIC_PER_CALL = BigInt(10_000);
export const NETWORK_LABEL = "Base Sepolia";
export const NETWORK_ID = "eip155:84532";
export const PAY_FETCH_TIMEOUT_MS = 20_000;
export const DECLINED_STATUS = 499; // "client closed request": the visitor cancelled before signing
