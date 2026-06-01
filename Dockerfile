FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

FROM base AS deps
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /repo
COPY --from=deps /repo/ ./
COPY apps/server/ apps/server/
COPY apps/web/ apps/web/
RUN pnpm --filter @chat/server build
RUN pnpm --filter @chat/web build

FROM node:20-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
ENV SERVER_PORT=3001
ENV WEB_ORIGIN=http://localhost:3001
ENV OPENCODE_SERVER_URL=http://host.docker.internal:4096
ENV STATIC_DIR=/app/web/dist

COPY --from=build --chown=node:node /repo/apps/server/package.json ./server/
COPY --from=build --chown=node:node /repo/apps/server/dist ./server/dist
COPY --from=build --chown=node:node /repo/apps/server/node_modules ./server/node_modules
COPY --from=build --chown=node:node /repo/apps/web/dist ./web/dist

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
