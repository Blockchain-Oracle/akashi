import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { EmptySlot, Header } from "@/components/header";
import { source } from "@/lib/source";

// The header spans the full width above sidebar, page and table of contents (Fumadocs' own header is mobile-only).
const GRID = {
  gridTemplate: "var(--docs-grid)",
  "--fd-docs-row-1": "var(--docs-header-height)",
  "--fd-docs-row-2": "var(--docs-header-height)",
  "--fd-docs-row-3": "calc(var(--docs-header-height) + var(--fd-toc-popover-height))",
} as React.CSSProperties;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      tabs={false}
      slots={{ header: Header, navTitle: EmptySlot }}
      searchToggle={{ enabled: false }}
      themeSwitch={{ enabled: false }}
      sidebar={{ collapsible: false, defaultOpenLevel: 1 }}
      containerProps={{ style: GRID }}
    >
      {children}
    </DocsLayout>
  );
}
