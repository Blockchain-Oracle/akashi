import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { ClaimCheck } from "@akashi/ui/diagrams/claim-check";
import { EnvelopeAnatomy } from "@akashi/ui/diagrams/envelope-anatomy";
import { McpFlow } from "@akashi/ui/diagrams/mcp-flow";
import { PaymentHandshake } from "@akashi/ui/diagrams/payment-handshake";
import { PlainSteps } from "@akashi/ui/diagrams/plain-steps";
import { Registration } from "@akashi/ui/diagrams/registration";
import { RequestPath } from "@akashi/ui/diagrams/request-path";
import { ServicePipeline } from "@akashi/ui/diagrams/service-pipeline";
import { SessionTimeline } from "@akashi/ui/diagrams/session-timeline";
import { VerdictGrid } from "@akashi/ui/diagrams/verdict-grid";

/** Stock Fumadocs components, available in every page without an import. */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    Accordion,
    Accordions,
    ClaimCheck,
    EnvelopeAnatomy,
    McpFlow,
    PaymentHandshake,
    PlainSteps,
    Registration,
    RequestPath,
    ServicePipeline,
    SessionTimeline,
    VerdictGrid,
    Callout,
    Card,
    Cards,
    File,
    Files,
    Folder,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
