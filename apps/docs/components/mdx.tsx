import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import { Exhibit } from "@/components/exhibit";
import { ServiceLedger } from "@/components/service-ledger";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    Callout,
    Card,
    Cards,
    Exhibit,
    ServiceLedger,
    Step,
    Steps,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
