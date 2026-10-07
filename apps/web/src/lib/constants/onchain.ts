/** Akashi's public on-chain records on Pocket Beta and Base Sepolia. Public values only. */
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
  supplierStakeTx: "E8997D51009D84EE42FFB9B69F0905C55AD4762ABD02F60645634784B97D4915",
  /** The first x402-paid run delivered as a Pocket relay (wikipedia/summary, $0.001), 2026-10-07. */
  firstPaidRunTx: "0xb544a3a445ed90c0a4d23794c63f6524723ea986628f5abac15b286c63c0a32b",
  /** MsgCreateClaim for that relay's session, then its proof; the claim settled at 16:14 UTC. */
  firstClaimTx: "AC215AB4282193BDE42DD2EA99E419C0E489F17594371D64988A89F3F9A3E244",
  firstProofTx: "6729C253844DF7CF7FEF9BDBD169F09D517067F2C09BF945D7659A4703E06560",
} as const;

export const AUDIT_URL =
  `https://mcp.pocketmcp.network/audit?network=beta&ids=${ONCHAIN.serviceId}&operator=${ONCHAIN.operator}`;

export const pocketTx = (tx: string) => `${POCKET_EXPLORER}/tx/${tx}`;
export const pocketService = (id: string) => `${POCKET_EXPLORER}/service/${id}`;
export const basescanTx = (tx: string) => `${BASESCAN}/tx/${tx}`;
export const basescanAddress = (address: string) => `${BASESCAN}/address/${address}`;
export const shortHash = (value: string, keep = 6) => `${value.slice(0, keep)}…${value.slice(-keep)}`;
