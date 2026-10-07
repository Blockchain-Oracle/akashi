/** CLI / local MCP constants. Every number names its reason. */
export const VERSION = "0.1.0";
export const DEFAULT_API_URL = "https://api.useakashi.xyz";
export const NETWORK = "eip155:84532"; // Base Sepolia (testnet USDC)
export const USDC_DECIMALS = 6;
/** Never sign more than this for one call unless the user raises it (the catalog's highest price is $0.01). */
export const DEFAULT_MAX_ATOMIC_PER_CALL = 10_000n;
/** Never spend more than this per process (CLI run or MCP session) unless the user raises it: $0.10. */
export const DEFAULT_MAX_TOTAL_ATOMIC = 100_000n;
export const REQUEST_TIMEOUT_MS = 20_000;
export const DEFAULT_DISCOVER_LIMIT = 5;
export const MCP_MAX_TEXT_CHARS = 12_000; // what one MCP tool result returns to the model
export const PRIVATE_KEY = /^(0x)?[0-9a-fA-F]{64}$/;
