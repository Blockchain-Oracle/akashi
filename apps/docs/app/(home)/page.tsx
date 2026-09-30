import Link from "next/link";

import { Bento } from "@/components/landing/bento";
import { BorderBeam } from "@/components/landing/border-beam";
import { CodeShowcase, type ShowcaseFile } from "@/components/landing/code-showcase";
import { ContainerScroll } from "@/components/landing/container-scroll";
import { Flow } from "@/components/landing/flow";
import { Footer } from "@/components/landing/footer";
import { HeroEvidence } from "@/components/landing/hero-evidence";
import { NetworkStatus } from "@/components/landing/network-status";
import { ScriptCopy } from "@/components/landing/script-copy";

export const revalidate = 60; // the live status pill

const CTA_BEAM_SIZE = 300;
const CTA_BEAM_DURATION_S = 16;

const INSTALL = {
  "Pay with x402": `npx -y mppx@0.11.0 https://test.agent.pocket.network/v1/citation-verify/v1/verify -J '{"citations":["arXiv:1706.03762"]}' --protocol x402`,
  "Claude Code (MCP)": "claude mcp add pocket-network -- npx -y @pocket-network/agentic-portal-mcp",
};

const FILES: ShowcaseFile[] = [
  {
    name: "verify.ts",
    lang: "ts",
    code: `import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as \`0x\${string}\`);
const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const payFetch = wrapFetchWithPayment(fetch, client);

const res = await payFetch("https://test.agent.pocket.network/v1/citation-verify/v1/verify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ citations: ["10.1016/S0140-6736(97)11096-0"] }),
});
const { data } = await res.json();
console.log(data.results[0].verdict); // "retracted"`,
  },
  {
    name: "check.py",
    lang: "python",
    code: `from eth_account import Account
from x402 import x402Client
from x402.http.clients import x402HttpxClient
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact.register import register_exact_evm_client

client = x402Client()
register_exact_evm_client(client, EthAccountSigner(Account.from_key(PRIVATE_KEY)))

async with x402HttpxClient(client) as http:
    r = await http.post(
        "https://test.agent.pocket.network/v1/code-reality-check/v1/packages",
        json={"items": [{"ecosystem": "pypi", "name": "reqeusts"}]},
    )
print(r.json()["data"]["results"][0]["verdict"])  # "does_not_exist"`,
  },
  {
    name: "terminal",
    lang: "bash",
    code: `MPPX_PRIVATE_KEY=0x... npx -y mppx@0.11.0 \\
  https://test.agent.pocket.network/v1/live-facts/v1/fx \\
  -J '{"base":"USD","quotes":["EUR"]}' --protocol x402 -i`,
  },
  {
    name: "mcp.json",
    lang: "json",
    code: `{
  "mcpServers": {
    "pocket-network": {
      "command": "npx",
      "args": ["-y", "@pocket-network/agentic-portal-mcp"],
      "env": { "POCKET_PRIVATE_KEY": "0x...", "POCKET_MAX_PER_CALL_ATOMIC": "10000" }
    }
  }
}`,
  },
];

const SOURCES = [
  "Crossref",
  "OpenAlex",
  "DataCite",
  "PubMed",
  "Caselaw Access Project",
  "npm",
  "PyPI",
  "crates.io",
  "Go proxy",
  "Maven Central",
  "ECB",
  "Bank of Canada",
  "MET Norway",
  "NOAA / NWS",
  "Wikidata",
  "IANA tz database",
  "GDELT",
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
      />

      <ContainerScroll
        title={
          <div className="flex flex-col items-center px-4">
            <NetworkStatus className="mb-7" />
            <h1 className="max-w-4xl text-balance font-display text-[2.75rem] leading-[1.02] tracking-[-0.02em] md:text-[4.75rem]">
              Evidence for what agents <em>claim</em>.
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-fd-muted-foreground text-lg leading-relaxed md:text-xl">
              Three pay-per-call checks on Pocket Network: is the citation real, does the package exist, is the fact
              current. Every answer names its sources, its age and whether they agree.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/docs/start/quickstart"
                className="rounded-full bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground text-sm transition hover:opacity-90 active:scale-[0.97]"
              >
                Make your first call in 3 minutes
              </Link>
              <Link
                href="/docs/reference"
                className="rounded-full border border-fd-border bg-fd-card px-6 py-3 font-medium text-sm transition hover:bg-fd-secondary active:scale-[0.97]"
              >
                Try the API reference
              </Link>
            </div>
            <ScriptCopy className="mt-9 text-left" commands={INSTALL} />
          </div>
        }
      >
        <HeroEvidence />
      </ContainerScroll>

      <section className="mx-auto w-full max-w-6xl px-6 pt-24 pb-8 md:pt-6">
        <div className="text-center">
          <h2 className="font-display text-4xl md:text-5xl">Ask, pay, get evidence</h2>
          <p className="mx-auto mt-3 max-w-xl text-fd-muted-foreground">
            Your agent asks the Pocket portal and pays $0.005 in USDC. Pocket Network relays the call to Akashi, which
            checks the records and sends back the verdict with its sources.
          </p>
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <Flow />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <Bento />
      </section>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">
            TypeScript · Python · CLI · MCP
          </div>
          <h2 className="mt-2 font-display text-4xl">From your stack, in a few lines</h2>
          <p className="mt-4 text-fd-muted-foreground leading-relaxed">
            Any x402 client can pay the portal: the official TypeScript and Python clients, the mppx CLI, or the Pocket
            MCP server inside Claude and Cursor. No Akashi SDK, no account and no API key.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-medium text-sm">
            <Link href="/docs/calling" className="text-fd-primary">
              Choose a route →
            </Link>
            <Link href="/docs/contract/response" className="text-fd-primary">
              Read the response contract →
            </Link>
          </div>
        </div>
        <CodeShowcase files={FILES} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="text-center font-mono text-[11px] text-fd-muted-foreground uppercase tracking-[0.16em]">
          Checked against the records themselves
        </div>
        <p className="mx-auto mt-5 max-w-4xl text-balance text-center font-display text-fd-muted-foreground text-xl leading-relaxed">
          {SOURCES.join(" · ")}
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-fd-border bg-fd-card px-8 py-14 text-center md:py-20">
          <BorderBeam size={CTA_BEAM_SIZE} duration={CTA_BEAM_DURATION_S} />
          <h2 className="relative mx-auto max-w-2xl text-balance font-display text-4xl md:text-5xl">
            Check your first citation in three minutes
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-fd-muted-foreground">
            A test wallet, faucet USDC and one TypeScript file. The quickstart walks you through every step.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/start/quickstart"
              className="rounded-full bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground text-sm transition hover:opacity-90 active:scale-[0.97]"
            >
              Start the quickstart
            </Link>
            <Link
              href="/docs/start/judges"
              className="rounded-full border border-fd-border px-6 py-3 font-medium text-sm transition hover:bg-fd-secondary active:scale-[0.97]"
            >
              What to try first
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
