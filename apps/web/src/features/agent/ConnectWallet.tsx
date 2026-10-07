"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

import { shortHash } from "@/lib/constants/onchain";
import { NETWORK_LABEL } from "@/lib/constants/wallet";

const ADDRESS_CHARS = 4;

/** The wallet pill (Masayume's connect ladder): connect → wrong network → address on Base Sepolia. */
export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openAccountModal, openChainModal }) => {
        if (!mounted) return <span className="invisible h-9 w-36" aria-hidden />;
        if (!account || !chain) {
          return (
            <button type="button" onClick={openConnectModal} className="inline-flex h-9 items-center gap-2 rounded-md bg-dark px-3.5 text-sm font-medium text-white hover:bg-dark-2">
              <Wallet className="size-4" aria-hidden /> Connect wallet
            </button>
          );
        }
        if (chain.unsupported) {
          return (
            <button type="button" onClick={openChainModal} className="inline-flex h-9 items-center rounded-md border border-destructive px-3.5 text-sm font-medium text-destructive">
              Switch to {NETWORK_LABEL}
            </button>
          );
        }
        return (
          <button type="button" onClick={openAccountModal} className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-background px-3 font-mono text-[0.8125rem] hover:bg-muted">
            <span className="size-2 rounded-full bg-success" aria-hidden /> {shortHash(account.address, ADDRESS_CHARS)}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
