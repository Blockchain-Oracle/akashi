import { EnvelopeAnatomy } from "@akashi/ui/diagrams/envelope-anatomy";
import { PlainSteps } from "@akashi/ui/diagrams/plain-steps";
import { Registration } from "@akashi/ui/diagrams/registration";
import { RequestPath } from "@akashi/ui/diagrams/request-path";
import { ArrowRight } from "lucide-react";

import { Failures } from "@/features/story/Failures";
import { PriceReceipt } from "@/features/story/PriceReceipt";
import { Section } from "@/features/story/Section";
import { ServiceCards } from "@/features/story/ServiceCards";
import { docsPage } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

/** Below the desk (specs/ui-revamp.md §5): why it matters, how it works, how it runs on Pocket, what it costs. */
export function Story() {
  return (
    <div>
      <Section
        id="why"
        tone="band"
        eyebrow="Why"
        title="Agents are wrong fluently."
        lead="Four measured failures, each with its source. An agent cannot tell these from the truth; Akashi can."
      >
        <Failures />
      </Section>

      <Section id="how" eyebrow="How it works" title="Check first, then answer." lead="Four steps, a few hundred milliseconds, half a cent.">
        <PlainSteps />
      </Section>

      <Section
        id="pocket"
        tone="console"
        eyebrow="On Pocket Network"
        title="Every check is a relay."
        lead="Agents pay the Agentic Portal; Pocket carries the call to Akashi and settles it on-chain."
      >
        <RequestPath />
      </Section>

      <Section
        id="services"
        tone="band"
        eyebrow="Three Pocket services"
        title="Sources, code and live facts."
        lead="One API, three capability-named services, each registered on Beta with its own card and price."
      >
        <ServiceCards />
      </Section>

      <Section id="answer" eyebrow="What comes back" title="Every answer carries its proof." lead="A typed envelope: the verdict, the record found, every source asked, and when it was assembled.">
        <EnvelopeAnatomy />
      </Section>

      <Section id="price" tone="band" eyebrow="Price" title="Half a cent a check." lead="The portal quotes, takes payment and settles. Akashi never sees a wallet." split>
        <PriceReceipt />
      </Section>

      <Section id="onchain" eyebrow="On-chain" title="Registered on Pocket Beta.">
        <Registration />
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={docsPage("pocket/how-a-call-flows")} className="btn btn-marker">
            How it runs on Pocket <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
          </a>
          <a href={docsPage()} className="btn btn-ink">
            What is Akashi?
          </a>
        </div>
      </Section>
    </div>
  );
}
