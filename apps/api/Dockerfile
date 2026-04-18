FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json

RUN npm ci

COPY apps/api apps/api

RUN npm --workspace apps/api run prisma:generate
RUN npm --workspace apps/api run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

EXPOSE 10000

CMD ["sh", "-c", "npm --workspace apps/api run prisma:migrate:deploy && npm --workspace apps/api run start"]
