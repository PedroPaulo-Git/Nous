# Deploy no Render

Este repositório foi preparado para duas opções:

- Sem Docker: [render.yaml](./render.yaml)
- Com Docker: [render.docker.yaml](./render.docker.yaml)

## Arquitetura

- `nous-web`: serviço web Node para `apps/web`
- `nous-api`: serviço web Node para `apps/api`
- `nous-postgres`: banco Postgres gerenciado no Render

## Opção 1: sem Docker

1. No Render, use `New +` -> `Blueprint`.
2. Selecione este repositório.
3. Use o arquivo `render.yaml`.
4. Na criação inicial, preencha:
   - `FRONTEND_ORIGIN` no `nous-api` com a URL pública do frontend
   - `NEXT_PUBLIC_API_URL` no `nous-web` com a URL pública do backend

## Opção 2: com Docker

O Render usa `render.yaml` como padrão, mas aceita um caminho customizado para o Blueprint. Para esta variante, há dois caminhos:

1. Criar o Blueprint apontando para `render.docker.yaml`.
2. Ou criar os serviços manualmente no painel com:
   - API:
     - Runtime: `Docker`
     - Dockerfile Path: `apps/api/Dockerfile`
     - Docker Context: `.`
   - Web:
     - Runtime: `Docker`
     - Dockerfile Path: `apps/web/Dockerfile`
     - Docker Context: `.`

Depois, configure as mesmas variáveis:

- `FRONTEND_ORIGIN` no `nous-api` com a URL pública do frontend
- `NEXT_PUBLIC_API_URL` no `nous-web` com a URL pública do backend
- `DATABASE_URL` vem automaticamente do banco no Blueprint
- `AUTH_JWT_SECRET` é gerado automaticamente no Blueprint

## Observações importantes

- O backend agora respeita `PORT`, que é a variável padrão do Render.
- O comando de inicialização da API roda `prisma migrate deploy` antes de subir o servidor.
- O `preDeployCommand` não foi usado para manter compatibilidade com plano free.
- O script raiz `npm run start` foi trocado para uma versão cross-platform. Mesmo assim, no Render o recomendado é não publicar o monorepo inteiro como um único Web Service.
- O deploy correto no Render é com dois serviços separados:
  - `nous-api` usando o comando do backend
  - `nous-web` usando o comando do frontend
- Como o frontend usa `NEXT_PUBLIC_API_URL` no browser, a URL pública da API precisa ser definida explicitamente.
- O CORS da API depende de `FRONTEND_ORIGIN`, então essa variável também precisa apontar para a URL pública do frontend.

## Se você criou um único serviço manualmente

Se o log mostra `Running 'npm run start'`, o Render está usando o script raiz do monorepo.

Isso não é o setup ideal para este projeto. Corrija de uma destas formas:

1. Preferido: recrie usando Blueprint e deixe o Render criar `nous-api` e `nous-web` separadamente.
2. Manual:
   - serviço da API:
     - Root Directory: vazio ou raiz do repositório
     - Build Command: `npm ci && npm --workspace apps/api run prisma:generate && npm --workspace apps/api run build`
     - Start Command: `npm --workspace apps/api run prisma:migrate:deploy && npm --workspace apps/api run start`
   - serviço do Web:
     - Root Directory: vazio ou raiz do repositório
     - Build Command: `npm ci && npm --workspace apps/web run build`
     - Start Command: `npm --workspace apps/web run start -- --hostname 0.0.0.0 --port $PORT`

## URLs esperadas

- Frontend: algo como `https://nous-web.onrender.com`
- Backend: algo como `https://nous-api.onrender.com`

Use essas URLs cruzadas nas variáveis públicas acima.
