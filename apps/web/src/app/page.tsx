import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { DEADLINE_MS, ENDPOINTS, PRICE_USDC, SERVICE_ORDER, SERVICES } from "@/lib/constants/services";
import { MS_PER_SECOND } from "@/lib/constants/ui";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6">
        <section className="border-b border-border py-20">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">証 akashi · proof</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-tight text-balance sm:text-6xl">
            Proof for what agents <em>claim</em>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            Three pay-per-call verification services on Pocket Network. Every answer is evidence: a typed verdict, the
            records it was checked against, how old they are and whether the sources agree.
          </p>
        </section>

        <section aria-labelledby="services" className="py-12">
          <h2 id="services" className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Services
          </h2>
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {SERVICE_ORDER.map((key) => {
              const service = SERVICES[key];
              return (
                <li key={key} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr]">
                  <span className="font-mark text-3xl leading-none" aria-hidden>
                    {service.kanji}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-2xl">{service.name}</h3>
                      <span className="mb-1.5 flex-1 self-end border-b border-dotted border-border" aria-hidden />
                      <code className="font-mono text-sm text-muted-foreground">{service.id}</code>
                    </div>
                    <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{service.summary}</p>
                    <p className="mt-4 font-mono text-xs text-muted-foreground">
                      POST {ENDPOINTS[key].join(" · ")}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      hard stop {DEADLINE_MS[key] / MS_PER_SECOND} s · ${PRICE_USDC} USDC per call
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
