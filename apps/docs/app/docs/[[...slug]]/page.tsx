import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OpenAPIPage } from "@/components/api-page";
import { getMDXComponents } from "@/components/mdx";
import { getPageMarkdownUrl } from "@/lib/shared";
import { source } from "@/lib/source";

type Props = { params: Promise<{ slug?: string[] }> };

/** Page titles in the display face (the ledger's record titles), like every heading in the prose. */
const TITLE = "text-balance font-display text-4xl leading-[1.05] font-bold tracking-[-0.025em]";
const DESCRIPTION = "mb-0 text-pretty";

export default async function Page({ params }: Props) {
  const page = source.getPage((await params).slug);
  if (!page) notFound();

  if (page.type === "openapi") {
    return (
      <DocsPage full>
        <DocsTitle className={TITLE}>{page.data.title}</DocsTitle>
        {/* the operation's own description renders inside the reference block */}
        <DocsBody>
          <OpenAPIPage {...page.data.getOpenAPIPageProps()} />
        </DocsBody>
      </DocsPage>
    );
  }

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle className={TITLE}>{page.data.title}</DocsTitle>
      <DocsDescription className={DESCRIPTION}>{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover markdownUrl={markdownUrl} />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
