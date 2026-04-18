# Prisma + PostgreSQL Local

Fluxo novo de migration:

1. Ajuste `apps/api/.env` com `DATABASE_URL`
2. Rode `npm run prisma:generate`
3. Rode `npm run prisma:migrate:dev -- --name <nome>`
4. Em produção/local limpo, rode `npm run prisma:migrate:deploy`

Observações:

- A pasta `apps/api/migrations` agora é legado.
- O fluxo oficial passa a ser `apps/api/prisma/schema.prisma` + `apps/api/prisma/migrations`.
- A migration inicial do Prisma já cria `auth.users`, `auth.uid()` e `pgcrypto`.
- `postgres-local-bootstrap.sql` fica apenas como referência legada.
