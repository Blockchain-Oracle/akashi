# ts-introspect — TypeScript Compiler API (pinned 6.0.3) answering npm symbol questions over HTTP.
# Build context: repo root. Runs .ts directly with Node's built-in type stripping (erasable syntax only).
FROM node:24-slim AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/ts-introspect/package.json services/ts-introspect/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @akashi/ts-introspect...

FROM node:24-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/ts-introspect/node_modules ./services/ts-introspect/node_modules
COPY services/ts-introspect/package.json services/ts-introspect/tsconfig.json ./services/ts-introspect/
COPY services/ts-introspect/src ./services/ts-introspect/src
ENV NODE_ENV=production PORT=3000 NODE_OPTIONS=--max-old-space-size=384
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:3000/health || exit 1
CMD ["node", "services/ts-introspect/src/index.ts"]
