# Vicoo Production Dockerfile
# Multi-stage build: install → build → run

FROM node:22-slim AS base
RUN npm install -g pnpm@10
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/*/package.json packages/*/
RUN pnpm install --frozen-lockfile

# Stage 2: Build web frontend
FROM deps AS build-web
COPY . .
RUN pnpm --filter vicoo-web build

# Stage 3: Production runtime
FROM base AS production
ENV NODE_ENV=production
ENV PORT=8000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY packages ./packages
COPY .env.example .env

# Copy built web frontend to serve as static
COPY --from=build-web /app/apps/web/dist ./apps/web/dist

# Create data directories
RUN mkdir -p apps/api/data apps/api/uploads/media apps/api/uploads/avatars apps/api/uploads/music

EXPOSE 8000

# Start API server (serves both API and static frontend)
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
