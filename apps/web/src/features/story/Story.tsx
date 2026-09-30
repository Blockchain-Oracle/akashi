import { EnvelopeAnatomy } from "@akashi/ui/diagrams/envelope-anatomy";
import { PlainSteps } from "@akashi/ui/diagrams/plain-steps";
import { Registration } from "@akashi/ui/diagrams/registration";
import { RequestPath } from "@akashi/ui/diagrams/request-path";
import { ArrowRight } from "lucide-react";

import { Failures } from "@/features/story/Failures";
import { PriceReceipt } from "@/features/story/PriceReceipt";
import { Section } from "@/features/story/Section";
import { ServiceLedger } from "@/features/story/ServiceLedger";
import { docsPage } from "@/lib/constants/site";

const ICON_STROKE = 1.5;

/** Below the desk (specs/web.md §3): why it matters, how it works, how it runs on Pocket, what it costs. */
export function Story() {
  return (
    <div className="pb-8">
      <Section id="why" eyebrow="Why" title={<>Agents are wrong <em>fluently</em>.</>}>
        <Failures />
      </Section>

      <Section id="how" eyebrow="How it works" title="Check first, then answer.">
        <PlainSteps />
      </Section>

      <Section
        id="pocket"
        eyebrow="On Pocket Network"
        title={<>Every check is a <em>relay</em>.</>}
        lead="Agents pay the Agentic Portal; Pocket carries the call to Akashi and settles it on-chain."
      >
        <RequestPath />
      </Section>

      <Section id="services" eyebrow="Three Pocket services" title="Sources, code and live facts.">
        <ServiceLedger />
      </Section>

      <Section id="answer" eyebrow="What comes back" title={<>Every answer carries its <em>proof</em>.</>}>
        <EnvelopeAnatomy />
      </Section>

      <Section
        id="price"
        eyebrow="Price"
        title="Half a cent a check."
        lead="The portal quotes, takes payment and settles. Akashi never sees a wallet."
        split
      >
        <PriceReceipt />
      </Section>

      <Section id="onchain" eyebrow="On-chain" title="Registered on Pocket Beta.">
        <Registration />
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={docsPage("pocket/how-a-call-flows")}
            className="inline-flex items-center gap-2 rounded-(--radius-chip) bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            How it runs on Pocket <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
          </a>
          <a
            href={docsPage()}
            className="inline-flex items-center gap-2 rounded-(--radius-chip) border border-border px-5 py-2.5 text-sm font-medium transition hover:border-primary"
          >
            What is Akashi?
          </a>
        </div>
      </Section>
    </div>
  );
}
