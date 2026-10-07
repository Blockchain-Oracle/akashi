/** Akashi's public on-chain records (docs/plan/ids-and-txs.md). Public values only. */
const POCKET_EXPLORER = "https://explorer.pocket.network/beta";
const BASESCAN = "https://sepolia.basescan.org";

export const ONCHAIN = {
  network: "Pocket Beta",
  serviceId: "tool-router",
  cupr: 20_000,
  registrationTx: "A96AAAB2B2BA81723ABB3C74BF10C7B79A7D55F07992D7F2F365B51D2AFE67F7",
  registrationHeight: 711_952,
  owner: "pokt16p53au7ctwrtfdwd23pt2tv54nj9f0n8wsj805",
  operator: "pokt1qnrjr3susgpyh4a4rx8f0x0wd6pqdtptr50ayg",
  payTo: "0x8164dabAfc824322221654ED421715FdaA66948D",
  paymentNetwork: "Base Sepolia",
} as const;

export const pocketTx = (tx: string) => `${POCKET_EXPLORER}/tx/${tx}`;
export const pocketService = (id: string) => `${POCKET_EXPLORER}/service/${id}`;
export const basescanTx = (tx: string) => `${BASESCAN}/tx/${tx}`;
export const basescanAddress = (address: string) => `${BASESCAN}/address/${address}`;
export const shortHash = (value: string, keep = 6) => `${value.slice(0, keep)}…${value.slice(-keep)}`;
