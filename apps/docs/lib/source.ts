import { llms, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

import { openapi } from "@/lib/openapi";
import { docsRoute } from "@/lib/shared";

const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema, postprocess: { includeProcessedMarkdown: true } },
  meta: { schema: metaSchema },
});

// MDX guides, plus one virtual page per API operation under /docs/reference/<service>/ (from the OpenAPI).
export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: await openapi.staticSource({
      baseDir: "reference",
      per: "operation",
      groupBy: (entry) => entry.schemaId,
      meta: true,
    }),
  },
  { baseUrl: docsRoute, plugins: [lucideIconsPlugin(), openapi.loaderPlugin()] },
);

type AnyPage = ReturnType<typeof source.getPages>[number];

async function pageMarkdown(page: AnyPage): Promise<string> {
  if (page.type === "openapi") return `${page.data.description ?? ""}\n\nSee the API reference page for the schema.`;
  return page.data.getText("processed");
}

/** llms.txt, llms-full.txt and per-page Markdown for "Copy Markdown". */
export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})\n\n${await pageMarkdown(page)}`,
});
