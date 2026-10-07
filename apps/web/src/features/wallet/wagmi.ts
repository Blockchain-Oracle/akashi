import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  braveWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "viem/chains";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";

import { publicEnv } from "@/lib/env";

/**
 * Base Sepolia only: x402 runs settle in testnet USDC there. Ported from the user's Masayume wagmi config: without
 * a WalletConnect project id only browser wallets are offered, and the sentinel id is never read by them.
 */
const NO_WALLETCONNECT_PROJECT = "akashi-injected-only";
export const WALLET_CONNECT_ENABLED = Boolean(publicEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
export const PAY_CHAIN = baseSepolia;

function walletGroups() {
  const browser = { groupName: "Browser", wallets: [injectedWallet, metaMaskWallet, rabbyWallet, braveWallet, coinbaseWallet] };
  if (!WALLET_CONNECT_ENABLED) return [browser];
  return [browser, { groupName: "Mobile", wallets: [walletConnectWallet] }];
}

export const wagmiConfig = createConfig({
  chains: [PAY_CHAIN],
  connectors: connectorsForWallets(walletGroups(), {
    appName: "Akashi",
    projectId: publicEnv.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? NO_WALLETCONNECT_PROJECT,
  }),
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: { [PAY_CHAIN.id]: http(publicEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL) },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
