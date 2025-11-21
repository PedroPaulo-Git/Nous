# Nous – All-in-One Productivity Suite

A complete SaaS productivity suite with **Notes**, **To-Dos**, **Flashcards**, and a **Secure Password Vault** with client-side encryption.

## 🚀 Features

- **📝 Notes**: Create and manage rich text notes with timestamps
- **✅ To-Dos**: Track tasks with checkbox completion
- **🎴 Flashcards**: Study with customizable flashcard decks
- **🔐 Password Vault**: Securely store passwords with client-side AES encryption (PBKDF2 + AES-256)
- **🌙 Dark Mode**: System-aware theme toggle ("black stylish" / "white stylish")
- **🌍 i18n**: Multi-language support (English & Portuguese)
- **🔒 Authentication**: Supabase Auth with email/password
- **💳 Subscription Model**: Freemium with subscription gating
- **👨‍💼 Admin Panel**: User management and subscription control

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18.3**
- **TypeScript 5.6**
- **TailwindCSS 3.4**
- **next-intl** (internationalization)
- **next-themes** (dark mode)
- **crypto-js** (client-side encryption)
- **Supabase SSR**

### Backend
- **Fastify 5.0**
- **TypeScript 5.6**
- **Supabase JS 2.45** (PostgreSQL + Auth)
- **Zod 3.23** (validation)
- **dotenv** (environment variables)

## 📦 Project Structure

```
Nous/
├── apps/
│   ├── api/              # Backend (Fastify)
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── plugins/  # Fastify plugins
│   │   │   ├── types/    # TypeScript types
│   │   │   └── server.ts # Entry point
│   │   └── package.json
│   └── web/              # Frontend (Next.js)
│       ├── app/          # App Router pages
│       ├── components/   # React components
│       ├── lib/          # Utilities
│       ├── messages/     # i18n translations
│       ├── types/        # TypeScript types
│       └── package.json
├── package.json          # Root workspace config
└── supabase.sql         # Database schema
```

## 🔧 Installation

### Prerequisites
- **Node.js 18+** (recommended: 20.x)
- **npm** or **yarn**
- **Supabase account** ([supabase.com](https://supabase.com))

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Nous.git
cd Nous
```

### 2. Install all dependencies
```bash
npm run install:all
```

Or install individually:
```bash
npm install
cd apps/api && npm install
cd ../web && npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire `supabase.sql` file
3. Get your API keys from **Project Settings → API**

### 4. Configure environment variables

#### Backend (`apps/api/.env`)
```env
API_PORT=4000
API_HOST=0.0.0.0
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

#### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=Nous
```

## 🚀 Running the Application

### Development Mode

#### Start both apps simultaneously:
```bash
npm run dev
```

This will:
- Start the backend at `http://localhost:4000`
- Start the frontend at `http://localhost:3000`

#### Start individually:
```bash
# Backend only
npm run dev:api

# Frontend only
npm run dev:web
```

### Production Mode

#### 1. Build both apps:
```bash
npm run build
```

#### 2. Start production servers:
```bash
npm run start
```

Or start individually:
```bash
# Backend
npm run start:api

# Frontend
npm run start:web
```

Open **http://localhost:3000** in your browser


## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all workspace dependencies |
| `npm run dev` | Start both apps in development mode |
| `npm run dev:api` | Start backend in dev mode (Fastify) |
| `npm run dev:web` | Start frontend in dev mode (Next.js) |
| `npm run build` | Build both apps for production |
| `npm run start` | Start both apps in production mode |
| `npm run start:api` | Start backend in production |
| `npm run start:web` | Start frontend in production |
| `npm run typecheck` | Run TypeScript type checking |

## 🔐 Authentication & Subscription Flow

### User Registration & Login
- Uses **Supabase Auth** with email/password
- Registration creates a profile with `is_subscribed = false` and `is_admin = false`
- Login redirects to the dashboard (`/`)

### Dashboard Behavior
- **Non-subscribed users**: See an upsell message and CTA to `/pricing`
- **Subscribed users**: See quick links to all 4 tools (Notes, To-Dos, Flashcards, Passwords)

### Route Protection
- Access to `/notes`, `/todos`, `/flashcards`, `/passwords` is **server-side gated**
- Non-subscribed users attempting to access these routes are redirected to `/pricing`
- Backend API also validates subscription status via JWT claims

## 🔐 Secure Password Manager

### Client-Side Encryption
The password vault uses **zero-knowledge encryption**:

1. **Passphrase**: User enters a master passphrase (ideally their account password)
2. **Key Derivation**: PBKDF2 with 10,000 iterations
   - Salt: User ID (unique per user)
   - Output: 256-bit encryption key
3. **Encryption**: AES-256-CBC
4. **Storage**: Only encrypted blob stored in Supabase
5. **Decryption**: Happens entirely in the browser

⚠️ **Important**: If you lose your passphrase, the vault **cannot be decrypted** (by design).

### Security Benefits
- Server never sees plaintext passwords
- Even database compromise doesn't expose passwords
- Industry-standard cryptography (AES-256, PBKDF2)

## 👨‍💼 Admin Panel

### Access Control
- Route: `/admin` (frontend)
- Protected by `profiles.is_admin = true`
- Admin-only backend endpoints: `/api/admin/*`

### Admin Capabilities
- View all registered users
- Toggle `is_subscribed` status for any user
- View user metadata (registration date, email)

### Creating an Admin User
Run this SQL in Supabase after registration:
```sql
UPDATE profiles 
SET is_admin = true, is_subscribed = true 
WHERE id = 'YOUR_USER_ID';
```

## 🗃️ Database Schema

### Tables
- **profiles**: User profiles with `is_subscribed`, `is_admin` flags
- **notes**: User notes with title, content, timestamps
- **todos**: User to-do items with title, completion status
- **flashcard_decks**: Flashcard deck containers with names
- **flashcards**: Individual flashcards with front/back text
- **password_vault**: Encrypted password storage (one row per user)

### Row-Level Security (RLS)
All tables have **RLS policies** enforcing:
- Users can only access their own data
- Admin routes bypass RLS using service role key
- Subscription checks enforced at application level

## 🌐 API Endpoints

### Public
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Authenticated (requires JWT)
- `GET /profiles` - Get current user profile
- `GET /notes` - List all notes
- `POST /notes` - Create note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `GET /todos` - List all todos
- `POST /todos` - Create todo
- `PUT /todos/:id` - Update todo
- `DELETE /todos/:id` - Delete todo
- `GET /flashcards/decks` - List decks
- `POST /flashcards/decks` - Create deck
- `GET /flashcards/decks/:deckId/cards` - List cards in deck
- `POST /flashcards/decks/:deckId/cards` - Create card
- `DELETE /flashcards/decks/:deckId/cards/:id` - Delete card
- `GET /vault` - Get encrypted vault
- `PUT /vault` - Update vault

### Admin Only
- `GET /admin/users` - List all users
- `PATCH /admin/users/:id/subscription` - Toggle subscription status

## 🌍 Internationalization (i18n)

### Supported Languages
- **English** (`en`)
- **Portuguese** (`pt-BR`)

### Language Switcher
- Located in the navbar
- Persists via cookie
- Translates all UI text dynamically

### Adding New Languages
1. Create `messages/[locale].json` (e.g., `messages/es.json`)
2. Add locale to `i18n.ts` config
3. Translate all keys from `messages/en.json`

## 🎨 Theming

### Available Themes
- **Dark** ("black stylish") - Default
- **Light** ("white stylish")

### Theme Toggle
- System-aware (respects OS preference)
- Persists via `localStorage`
- Smooth transitions with TailwindCSS classes

## 🚀 Production Deployment

### Recommended Architecture
```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Vercel    │─────▶│    Nginx     │─────▶│   Supabase   │
│  (Next.js)  │      │  (Reverse    │      │  (Postgres)  │
│             │      │   Proxy)     │      │              │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Fastify    │
                     │  (Backend)   │
                     └──────────────┘
```

### Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS everywhere
- [ ] Configure CORS to your Next.js domain
- [ ] Rotate service role key if exposed
- [ ] Enable Supabase connection pooling
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Configure rate limiting on Fastify
- [ ] Use environment variable secrets management
- [ ] Set up CI/CD (GitHub Actions)

### Environment-Specific Notes
- **Vercel**: Deploy Next.js with `NEXT_PUBLIC_*` env vars
- **Railway/Fly.io**: Deploy Fastify with persistent volume for logs
- **Supabase**: Use production tier for higher connection limits

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Errors
```bash
npm run typecheck
```
If errors persist, check that all `@types/*` packages are installed.

#### CORS Errors
Ensure `NEXT_PUBLIC_API_URL` in frontend matches backend's allowed origin.

#### Database Connection Errors
- Verify Supabase URL and keys are correct
- Check that RLS policies are enabled
- Ensure service role key is used on backend

#### Build Failures
```bash
rm -rf node_modules apps/*/node_modules
npm run install:all
npm run build
```

## 📝 License

MIT License - see `LICENSE` file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Nous/issues)
- **Email**: support@Nous.com
- **Docs**: [Documentation](https://docs.Nous.com)

---

**Built with ❤️ using Next.js, Fastify, and Supabase**