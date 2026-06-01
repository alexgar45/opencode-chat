FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

FROM base AS build
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/ apps/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @chat/server build
RUN pnpm --filter @chat/web build

FROM base AS prod-deps
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN pnpm install --prod --frozen-lockfile
RUN pnpm --filter @chat/server deploy --legacy /prod/server
RUN pnpm --filter @chat/web deploy --legacy /prod/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV SERVER_PORT=3001
ENV WEB_ORIGIN=http://localhost:3001
ENV OPENCODE_SERVER_URL=http://host.docker.internal:4096
ENV STATIC_DIR=/app/web/dist

COPY --from=build --chown=node:node /repo/apps/server/dist ./server/dist
COPY --from=prod-deps --chown=node:node /prod/server/node_modules ./server/node_modules
COPY --from=build --chown=node:node /repo/apps/web/dist ./web/dist

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server/dist/index.js"]
