# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat ffmpeg
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/seed/package.json packages/seed/package.json
RUN npm ci

WORKDIR /app/packages/shared
COPY packages/shared .
RUN npm run build

WORKDIR /app/apps/web
COPY apps/web .
RUN node ../../scripts/gen-postgres-schema.mjs && npx prisma generate --schema prisma/schema.postgres.prisma

WORKDIR /app/apps/web
CMD ["npx", "tsx", "worker/index.ts"]
