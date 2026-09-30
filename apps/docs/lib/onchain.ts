/** Akashi's on-chain records on Pocket Network Beta (docs/plan/ids-and-txs.md). */
const EXPLORER = "https://explorer.pocket.network/beta";

// registered 2026-09-30
export const ONCHAIN = {
  owner: "pokt16p53au7ctwrtfdwd23pt2tv54nj9f0n8wsj805",
  services: {
    cite: { cupr: 40_000, tx: "8CA28E2F9F8628FD8BF017D56A259702EF2D4FB62BF56B4ECCBF630DCA22BF6C", height: 691_097 },
    code: { cupr: 20_000, tx: "0829C8D96D3911A73948471568D63F8D03AEB6DCB5ECDE1B1136515229642E2E", height: 691_098 },
    now: { cupr: 10_000, tx: "33CD6B89D18036FFAC17D8AAF0F9E8FB4D087B8FE5FFFD410CD4899265D69C09", height: 691_099 },
  },
} as const;

export function explorerTx(tx: string) {
  return `${EXPLORER}/tx/${tx}`;
}

export function explorerService(id: string) {
  return `${EXPLORER}/service/${id}`;
}

