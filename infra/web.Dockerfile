# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# deps
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/seed/package.json packages/seed/package.json
RUN npm ci

# build shared package
FROM base AS shared
COPY --from=deps /app/node_modules ./node_modules
WORKDIR /app/packages/shared
COPY packages/shared .
RUN npm run build

# builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared /app/packages/shared/dist ./packages/shared/dist
COPY packages/shared ./packages/shared
WORKDIR /app/apps/web
COPY apps/web .
RUN node ../../scripts/gen-postgres-schema.mjs && npx prisma generate --schema prisma/schema.postgres.prisma && npm run build

# runner
FROM node:22-alpine AS runner
RUN apk add --no-cache ffmpeg
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone/apps/web ./

EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
