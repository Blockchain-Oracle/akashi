import { Seal, Wordmark } from "@akashi/brand/react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { site } from "@/lib/site";
import { source } from "@/lib/source";

function Title() {
  return (
    <span className="docs-brand">
      <Seal className="size-6" label={null} />
      <Wordmark className="h-3 w-auto" kanji={false} />
      <span className="text-sm text-fd-muted-foreground">Docs</span>
    </span>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{ title: <Title />, url: "/" }}
      links={[{ text: "Try it", url: site.app, external: true }]}
      githubUrl={site.repo}
    >
      {children}
    </DocsLayout>
  );
}
