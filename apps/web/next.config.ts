import path from "node:path";

import type { NextConfig } from "next";

import { DOCS_URL } from "./src/lib/constants/site";

const REPO_ROOT = path.join(import.meta.dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  // The workspace packages live above apps/web: trace from the repo root so the standalone server includes them.
  outputFileTracingRoot: REPO_ROOT,
  transpilePackages: ["@akashi/api-client", "@akashi/brand", "@akashi/model"],
  // Next 16 writes AGENTS.md and CLAUDE.md on `next dev`; this repository carries no AI-tool files.
  agentRules: false,
  poweredByHeader: false,
  redirects: async () => [
    { source: "/docs", destination: DOCS_URL, permanent: false },
    { source: "/docs/:path*", destination: `${DOCS_URL}/:path*`, permanent: false },
    { source: "/llms.txt", destination: `${DOCS_URL}/llms.txt`, permanent: false },
  ],
};

export default nextConfig;
