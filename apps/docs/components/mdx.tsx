import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { EnvelopeAnatomy } from "@/components/diagrams/envelope-anatomy";
import { McpFlow } from "@/components/diagrams/mcp-flow";
import { PaymentHandshake } from "@/components/diagrams/payment-handshake";
import { Registration } from "@/components/diagrams/registration";
import { RequestPath } from "@/components/diagrams/request-path";
import { ServicePipeline } from "@/components/diagrams/service-pipeline";
import { SessionTimeline } from "@/components/diagrams/session-timeline";
import { VerdictGrid } from "@/components/diagrams/verdict-grid";

/** Stock Fumadocs components, available in every page without an import. */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    Accordion,
    Accordions,
    EnvelopeAnatomy,
    McpFlow,
    PaymentHandshake,
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
