import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function buildAuthResponse(user: { id: string; email: string }, secret: string) {
  const expiresInSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);
  const access_token = signJwt(
    {
      sub: user.id,
      email: user.email,
    },
    secret,
    expiresInSeconds
  );

  return {
    access_token,
    token_type: 'bearer',
    expires_in: expiresInSeconds,
    user: {
      id: user.id,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
    },
  };
}

export async function authRoutes(app: FastifyInstance) {
  const jwtSecret = process.env.AUTH_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('AUTH_JWT_SECRET not set');
  }

  app.post('/register', async (req, reply) => {
    const parsed = AuthSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await app.db.query<{ id: string }>(
      'SELECT id FROM auth.users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (existing.rows.length > 0) {
      return reply.conflict('Email already registered');
    }

    const passwordHash = hashPassword(parsed.data.password);
    const insertedUser = await app.db.query<{ id: string; email: string }>(
      'INSERT INTO auth.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    const user = insertedUser.rows[0];

    await app.db.query(
      'INSERT INTO public.profiles (id, is_subscribed, is_admin) VALUES ($1, false, false)',
      [user.id]
    );

    return buildAuthResponse(user, jwtSecret);
  });

  app.post('/login', async (req, reply) => {
    const parsed = AuthSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const email = parsed.data.email.toLowerCase().trim();
    const result = await app.db.query<{ id: string; email: string; password_hash: string }>(
      'SELECT id, email, password_hash FROM auth.users WHERE email = $1 LIMIT 1',
      [email]
    );

    const user = result.rows[0];
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return reply.unauthorized('Invalid email or password');
    }

    return buildAuthResponse(user, jwtSecret);
  });
}
