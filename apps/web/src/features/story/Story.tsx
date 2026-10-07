import { Registration } from "@akashi/ui/diagrams/registration";
import { RequestPath } from "@akashi/ui/diagrams/request-path";
import { ArrowRight } from "lucide-react";

import { AGENT_PATH, docsPage } from "@/lib/constants/site";
import { ICON_STROKE } from "@/lib/constants/ui";

import { BlueBand } from "./BlueBand";
import { Bubbles } from "./Bubbles";
import { Failures } from "./Failures";
import { Section } from "./Section";
import { ServiceSections } from "./ServiceSections";
import { SourceCircles } from "./SourceCircles";

/** Below the desk, in HTTPie's section grammar (specs/ui-v3-httpie.md §4): the problem, the three services, Pocket, the band, the proof. */
export function Story() {
  return (
    <div>
      <Section id="said" eyebrow="Said with confidence" title="Agents are wrong fluently." lead="Six things assistants have said, each read against the record. An agent cannot tell these from the truth; Akashi can.">
        <Bubbles />
      </Section>

      <ServiceSections />

      <Section id="pocket" tone="blob" eyebrow="On Pocket Network" title="Every check is a relay." lead="Agents pay the Agentic Portal half a cent in USDC; Pocket carries the call to Akashi and settles it on-chain. No account, no API key.">
        <RequestPath />
      </Section>

      <BlueBand />

      <Section id="measured" eyebrow="Measured, not promised" title="Why it matters." lead="Four measured failures, each with its source, and what is true of Akashi today.">
        <Failures />
      </Section>

      <Section id="record" tone="band" eyebrow="Read from the record" title="Checked against the originals." lead="Every answer names the sources it read, their licence and their age. These are them.">
        <SourceCircles />
      </Section>

      <Section id="onchain" eyebrow="On-chain" title="Registered on Pocket Beta." align="left">
        <Registration />
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={AGENT_PATH} className="btn btn-go">
            Talk to the agent <ArrowRight className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
          </a>
          <a href={docsPage("pocket/how-a-call-flows")} className="btn btn-ink">
            How it runs on Pocket
          </a>
        </div>
      </Section>
    </div>
  );
}
