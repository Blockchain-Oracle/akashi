import { z } from "zod";

/** Public settings for the docs app (NEXT_PUBLIC_* are inlined at build; an empty string counts as unset). */
const LOCAL_DOCS_URL = "http://localhost:3200";
const LOCAL_APP_URL = "http://localhost:3100";

const env = z
  .object({ NEXT_PUBLIC_DOCS_URL: z.url().default(LOCAL_DOCS_URL), NEXT_PUBLIC_APP_URL: z.url().default(LOCAL_APP_URL) })
  .parse({
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL || undefined,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  });

export const site = {
  docs: env.NEXT_PUBLIC_DOCS_URL,
  app: env.NEXT_PUBLIC_APP_URL,
  repo: "https://github.com/Blockchain-Oracle/akashi",
  themeStorageKey: "akashi-docs-theme",
} as const;
