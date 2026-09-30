import { loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // eyebrow: the mono line above the title (section · kanji), as on the app's ledger
    schema: pageSchema.extend({ eyebrow: z.string().optional() }),
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

export const source = loader({ baseUrl: "/", source: docs.toFumadocsSource() });
