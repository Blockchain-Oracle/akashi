# syntax=docker/dockerfile:1
# akashi-gateway: the public x402 front door. Built from the repo root:
#   docker build -f services/gateway/Dockerfile .
# esbuild bundles the server and its dependencies into one ESM file, so the runtime image is node + that file.
ARG NODE_IMAGE=node:24-slim

FROM ${NODE_IMAGE} AS build
ARG PNPM_VERSION=11.24.0
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY services/gateway/package.json services/gateway/
RUN --mount=type=cache,id=akashi-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @akashi/gateway
COPY services/gateway services/gateway
RUN pnpm --filter @akashi/gateway build

FROM ${NODE_IMAGE}
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /app/services/gateway/dist/server.mjs ./server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD curl -fsS http://localhost:8080/v1/health || exit 1
CMD ["node", "server.mjs"]
