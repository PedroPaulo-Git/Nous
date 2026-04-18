FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/web apps/web

RUN npm --workspace apps/web run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/package.json apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs apps/web/next.config.mjs

EXPOSE 10000

CMD ["sh", "-c", "npm --workspace apps/web run start -- --hostname 0.0.0.0 --port ${PORT:-10000}"]
