import { Seal, Wordmark } from "@akashi/brand/react";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { site } from "@/lib/site";

/** Shared by the landing page (HomeLayout) and the docs (DocsLayout). */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2.5 text-fd-foreground">
          <Seal className="size-6" label={null} />
          <Wordmark className="h-2.5 w-auto" kanji={false} />
        </span>
      ),
    },
    links: [
      { text: "Docs", url: "/docs", active: "nested-url" },
      { text: "API reference", url: "/docs/reference", active: "nested-url" },
      { text: "Open the desk ↗", url: site.app, external: true },
    ],
  };
}
