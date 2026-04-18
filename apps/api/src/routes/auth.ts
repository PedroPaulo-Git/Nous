import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signJwt } from '../lib/jwt.js';

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type AuthRouteError = {
  statusCode: number;
  code: string;
  error: string;
  message: string;
};

type PgLikeError = {
  code?: string;
  constraint?: string;
  message?: string;
};

type AuthAction = 'login' | 'register';

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

function replyWithAuthError(reply: FastifyReply, payload: AuthRouteError) {
  return reply.code(payload.statusCode).send(payload);
}

function mapAuthError(error: unknown, action: AuthAction): AuthRouteError {
  const pgError = error as PgLikeError | undefined;
  const message = pgError?.message || '';

  if (pgError?.code === '42P01' && /auth\.users|public\.profiles/i.test(message)) {
    return {
      statusCode: 503,
      code: 'AUTH_STORAGE_NOT_READY',
      error: 'Service Unavailable',
      message: 'Authentication service is not configured yet. Please try again later.',
    };
  }

  if (pgError?.code === '23505' && pgError.constraint === 'users_email_key') {
    return {
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      error: 'Conflict',
      message: 'Email already registered.',
    };
  }

  if (pgError?.code?.startsWith('08')) {
    return {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      error: 'Service Unavailable',
      message: 'Database connection is unavailable. Please try again later.',
    };
  }

  return {
    statusCode: 500,
    code: action === 'login' ? 'LOGIN_FAILED' : 'REGISTRATION_FAILED',
    error: 'Internal Server Error',
    message:
      action === 'login'
        ? 'Unable to complete login right now. Please try again later.'
        : 'Unable to create account right now. Please try again later.',
  };
}

function logAuthFailure(
  app: FastifyInstance,
  action: AuthAction,
  email: string,
  error: unknown,
  response: AuthRouteError
) {
  const pgError = error as PgLikeError | undefined;

  app.log.error(
    {
      event: 'auth_request_failed',
      action,
      email,
      statusCode: response.statusCode,
      code: response.code,
      dbCode: pgError?.code,
      dbConstraint: pgError?.constraint,
      dbMessage: pgError?.message,
      clientMessage: response.message,
    },
    `Authentication ${action} failed`
  );
}

export async function authRoutes(app: FastifyInstance) {
  const jwtSecret = process.env.AUTH_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('AUTH_JWT_SECRET not set');
  }

  app.post('/register', async (req, reply) => {
    const parsed = AuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return replyWithAuthError(reply, {
        statusCode: 400,
        code: 'INVALID_AUTH_PAYLOAD',
        error: 'Bad Request',
        message: 'Please provide a valid email and a password with at least 6 characters.',
      });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const passwordHash = hashPassword(parsed.data.password);
    const client = await app.db.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query<{ id: string }>(
        'SELECT id FROM auth.users WHERE email = $1 LIMIT 1',
        [email]
      );

      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return replyWithAuthError(reply, {
          statusCode: 409,
          code: 'EMAIL_ALREADY_REGISTERED',
          error: 'Conflict',
          message: 'Email already registered.',
        });
      }

      const insertedUser = await client.query<{ id: string; email: string }>(
        'INSERT INTO auth.users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );
      const user = insertedUser.rows[0];

      await client.query(
        'INSERT INTO public.profiles (id, is_subscribed, is_admin) VALUES ($1, false, false)',
        [user.id]
      );

      await client.query('COMMIT');
      return buildAuthResponse(user, jwtSecret);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      const authError = mapAuthError(error, 'register');
      logAuthFailure(app, 'register', email, error, authError);
      return replyWithAuthError(reply, authError);
    } finally {
      client.release();
    }
  });

  app.post('/login', async (req, reply) => {
    const parsed = AuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return replyWithAuthError(reply, {
        statusCode: 400,
        code: 'INVALID_AUTH_PAYLOAD',
        error: 'Bad Request',
        message: 'Please provide a valid email and a password with at least 6 characters.',
      });
    }

    try {
      const email = parsed.data.email.toLowerCase().trim();
      const result = await app.db.query<{ id: string; email: string; password_hash: string }>(
        'SELECT id, email, password_hash FROM auth.users WHERE email = $1 LIMIT 1',
        [email]
      );

      const user = result.rows[0];
      if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
        return replyWithAuthError(reply, {
          statusCode: 401,
          code: 'INVALID_CREDENTIALS',
          error: 'Unauthorized',
          message: 'Invalid email or password.',
        });
      }

      return buildAuthResponse(user, jwtSecret);
    } catch (error) {
      const email = parsed.data.email.toLowerCase().trim();
      const authError = mapAuthError(error, 'login');
      logAuthFailure(app, 'login', email, error, authError);
      return replyWithAuthError(reply, authError);
    }
  });
}
