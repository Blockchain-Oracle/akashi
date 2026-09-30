import path from "node:path";

import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

export default withMDX({
  output: "standalone",
  // The workspace packages live above apps/docs: trace from the repo root so the standalone server includes them.
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@akashi/api-client", "@akashi/brand"],
  // Next 16 writes AGENTS.md and CLAUDE.md on `next dev`; this repository carries no AI-tool files.
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
});
