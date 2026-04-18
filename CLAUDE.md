# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs both apps)
```bash
npm run dev          # Start both frontend and backend in development
npm run build        # Build both apps for production
npm run typecheck    # TypeScript validation for both apps
npm run lint         # ESLint on frontend
```

### Backend only (`apps/api/`)
```bash
npm run dev          # tsx watch src/server.ts (port 4000)
npm run build        # tsc → dist/
npm run start        # node dist/server.js
```

### Frontend only (`apps/web/`)
```bash
npm run dev          # next dev (port 3000)
npm run build        # next build
npm run lint         # next lint
```

> On Windows, `npm run dev` from root uses PowerShell to launch two separate terminal windows.

## Architecture

This is a **monorepo** (`npm workspaces`) with two independent apps:

### `apps/api/` — Fastify 5 backend
- **Entry**: `src/server.ts` — registers plugins and all route modules
- **Plugins**: `src/plugins/auth.ts` extracts JWT from `Authorization: Bearer`, loads user profile, attaches `request.user` and `request.profile` to every authenticated request. `src/plugins/supabase.ts` initializes the Supabase client using the service role key.
- **Routes**: Each feature is a self-contained Fastify route file in `src/routes/`. Routes use Zod schemas for body validation and call Supabase directly (no ORM).
- **Auth pattern**: Routes call `request.jwtUser` (JwtUser) for the user ID, then query Supabase with `.eq('user_id', request.jwtUser.id)`. RLS is a second layer of defense.

### `apps/web/` — Next.js 15 App Router frontend
- **Entry**: `app/layout.tsx` — sets up ThemeProvider, NextIntlClientProvider, Toaster
- **Middleware**: `middleware.ts` — protects all `/dashboard` and `/admin` routes; also gates non-admin users without an active subscription
- **API calls**: All backend communication goes through `lib/api.ts`, which reads the Supabase session token and injects it as `Authorization: Bearer` on every request
- **Auth**: Supabase SSR — server components use `supabase-server.ts`, client components use `supabase-client.ts`
- **i18n**: `next-intl` with `messages/en.json` and `messages/pt-BR.json`; locale is set in `middleware.ts`

### Database
- Supabase (PostgreSQL) with Row-Level Security on all tables
- Full schema in `supabase.sql` at the root
- New feature migrations go in `apps/api/migrations/`

### Password encryption
Passwords are AES-256 encrypted **client-side** before being sent to the API. The encryption key is derived from the user's master password in `apps/web/lib/crypto.ts`. The server never sees plaintext passwords.

## Key conventions

- **Adding a new feature**: create `apps/api/src/routes/<feature>.ts`, register it in `apps/api/src/server.ts`, add the frontend page under `apps/web/app/dashboard/<feature>/`, and add translations in both `messages/` files.
- **Types**: Backend types live in `apps/api/src/types/`. Frontend types live in `apps/web/types/`. They are not shared — define separately in each app.
- **Zod validation**: All POST/PATCH route bodies must be validated with a Zod schema before use.
- **Subscription gating**: `middleware.ts` already gates `/dashboard` routes for non-subscribed users. Admin routes are gated separately.
