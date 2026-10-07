import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { DEMO_COVER, DEMO_VIDEO_ID, demoEmbedUrl, demoVideoUrl } from "@/lib/constants/demo";
import { AUDIT_URL, ONCHAIN, basescanTx, pocketService, pocketTx, shortHash } from "@/lib/constants/onchain";
import { getCatalog } from "@/lib/catalog/catalog.server";
import { REPO_URL } from "@/lib/constants/site";

// Rendered per request, like /tools: the footer counts tools from the live catalog.
export const dynamic = "force-dynamic";

const title = "Watch Akashi work";
const description =
  "An agent finds a tool, pays a fraction of a cent over x402, and the run travels over Pocket Network. Then check " +
  "every step yourself: the payment on Base Sepolia, the relay claim on Pocket, and the Service Audit.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/demo" },
  openGraph: { title, description, images: [{ url: DEMO_COVER.src, width: DEMO_COVER.width, height: DEMO_COVER.height, alt: title }] },
  twitter: { card: "summary_large_image", title, description, images: [DEMO_COVER.src] },
};

const external = "text-brand underline-offset-4 hover:underline";

const STEPS = [
  {
    title: "Ask the agent",
    body: (
      <>
        Open the <Link className={external} href="/agent">agent</Link> and ask something that needs live data, such as
        &ldquo;Is it raining in Lagos, and what is 100 USD in naira?&rdquo; Demo credit pays, so no wallet is needed. Each
        answer shows the tool it chose, the x402 receipt and the line &ldquo;Pocket relay · {ONCHAIN.serviceId}&rdquo;.
      </>
    ),
  },
  {
    title: "Open a payment",
    body: (
      <>
        Every receipt links its USDC transfer on Base Sepolia. The first relayed paid run is{" "}
        <a className={external} href={basescanTx(ONCHAIN.firstPaidRunTx)}>{shortHash(ONCHAIN.firstPaidRunTx)}</a>:
        0.001 USDC from the payer to Akashi, settled only after the tool answered.
      </>
    ),
  },
  {
    title: "Find the relay on Pocket",
    body: (
      <>
        Akashi&apos;s RelayMiner claimed that session in{" "}
        <a className={external} href={pocketTx(ONCHAIN.firstClaimTx)}>{shortHash(ONCHAIN.firstClaimTx)}</a> and proved it
        in <a className={external} href={pocketTx(ONCHAIN.firstProofTx)}>{shortHash(ONCHAIN.firstProofTx)}</a>; the claim
        settled on {ONCHAIN.network}. The service and its supplier are on the{" "}
        <a className={external} href={pocketService(ONCHAIN.serviceId)}>Pocket explorer</a>.
      </>
    ),
  },
  {
    title: "Run the Service Audit",
    body: (
      <>
        Pocket&apos;s own acceptance check, rules A1 to A9, live: <a className={external} href={AUDIT_URL}>open the audit
        for {ONCHAIN.serviceId}</a>. It passes all nine.
      </>
    ),
  },
  {
    title: "Browse the tools",
    body: (
      <>
        <Link className={external} href="/tools">All the tools</Link>, each with its price, input schema and a working
        example, and the <a className={external} href={REPO_URL}>source on GitHub</a>.
      </>
    ),
  },
];

export default async function DemoPage() {
  const catalog = await getCatalog();
  const tools = catalog.endpoints.filter((e) => e.available).length;
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1040px] px-4 py-14 sm:px-6">
        <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-muted-foreground uppercase">
          The Akashi demo · {ONCHAIN.network}
        </p>
        <h1 className="display mt-4 text-[clamp(2.4rem,6vw,3.75rem)]">Watch Akashi work.</h1>
        <p className="mt-4 max-w-[640px] text-lg text-muted-foreground">{description}</p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-muted">
          {DEMO_VIDEO_ID ? (
            <iframe
              className="aspect-video w-full"
              src={demoEmbedUrl(DEMO_VIDEO_ID)}
              title="Akashi: the demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <Link href="/agent" aria-label="Try the agent live">
              <Image src={DEMO_COVER.src} width={DEMO_COVER.width} height={DEMO_COVER.height} alt={title} priority
                     className="h-auto w-full" />
            </Link>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {DEMO_VIDEO_ID ? (
            <a className={external} href={demoVideoUrl(DEMO_VIDEO_ID)}>Watch on YouTube</a>
          ) : (
            "The narrated film is on its way. Until then, everything it shows can be done live, below."
          )}
        </p>

        <h2 className="display mt-16 text-[1.75rem]">Check it yourself</h2>
        <ol className="mt-6 grid gap-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-background p-5">
              <span className="font-mono text-sm text-brand">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter toolCount={tools} />
    </>
  );
}
