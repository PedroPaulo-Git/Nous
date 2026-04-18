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
- Como o frontend usa `NEXT_PUBLIC_API_URL` no browser, a URL pública da API precisa ser definida explicitamente.
- O CORS da API depende de `FRONTEND_ORIGIN`, então essa variável também precisa apontar para a URL pública do frontend.

## URLs esperadas

- Frontend: algo como `https://nous-web.onrender.com`
- Backend: algo como `https://nous-api.onrender.com`

Use essas URLs cruzadas nas variáveis públicas acima.
