/** Gateway constants. Every limit names the reason it has that value. */

export const SERVICE_NAME = "Akashi";
export const SERVICE_ID = "tool-router"; // the Pocket service every paid run is relayed to
export const RUN_PREFIX = "/v1/run";
export const VALIDATE_PREFIX = "/v1/validate";

// x402 on Base Sepolia (context/05-external-libs/x402.md): exact scheme, testnet USDC, the public facilitator.
export const DEFAULT_NETWORK = "eip155:84532" as const;
export const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";
export const PAYMENT_TIMEOUT_S = 60; // the signed authorization stays valid this long (portal uses 60 s too)
export const USDC_DECIMALS = 6;
// The facilitator's relayer races itself when two settlements overlap (serial-facilitator.ts): queue them, and retry
// a lost race once after roughly one Base block (2 s), well inside PAYMENT_TIMEOUT_S.
export const SETTLE_RETRY_ATTEMPTS = 2;
export const SETTLE_RETRY_DELAY_MS = 1_500;
export const SETTLE_RACE_MARKERS = ["replacement transaction underpriced", "nonce too low", "already known"];

// A run must answer within Pocket's ~10 s gateway window; the API's own per-endpoint deadline is ≤ 9 s.
export const RUN_FORWARD_TIMEOUT_MS = 9_500;
export const READ_FORWARD_TIMEOUT_MS = 4_000;
export const CATALOG_FETCH_TIMEOUT_MS = 5_000;
export const CATALOG_RETRY_DELAY_MS = 2_000;
export const CATALOG_RETRY_ATTEMPTS = 30; // ~1 minute: the api container may still be starting
export const MAX_BODY_BYTES = 65_536; // Pocket portal/relay request cap (≈ 64 KiB)
// The api may deploy without the gateway: re-read its catalog this often and rebuild the paid route table on change.
export const CATALOG_REFRESH_MS = 60_000;

// Status codes the gateway produces itself
export const HTTP_OK = 200;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_NOT_FOUND = 404;
export const HTTP_UNPROCESSABLE = 422;
export const HTTP_PAYLOAD_TOO_LARGE = 413;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_SERVER_ERROR_MIN = 500;

// Headers browsers must be allowed to read for the x402 flow
export const EXPOSED_HEADERS = ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", "X-Akashi-Via", "X-Akashi-Endpoint"];
export const VIA_HEADER = "X-Akashi-Via";
export const ENDPOINT_HEADER = "X-Akashi-Endpoint";

// Remote MCP (/mcp): runs are paid by Akashi's demo wallet so any MCP client can try a tool without a wallet.
export const MCP_DEMO_MAX_ATOMIC_PER_CALL = 10_000n; // $0.01
export const MCP_DEMO_PER_IP_DAILY_ATOMIC = 50_000n; // $0.05 per visitor per day
export const MCP_DEMO_DAILY_ATOMIC = 2_000_000n; // $2 per day overall
export const MCP_MAX_TEXT_CHARS = 12_000;
export const DAY_MS = 86_400_000;
export const DEFAULT_DISCOVER_LIMIT = 5;
export const MAX_DISCOVER_LIMIT = 25;
