import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

function getAllowedOrigins() {
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://nous-backend-wvtf.onrender.com',
    ...configuredOrigins
  ].map(normalizeOrigin);
}

/**
 * Core Fastify plugins (CORS, sensible defaults).
 */
export default fp(async function core(app) {
  const allowedOrigins = getAllowedOrigins();

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow same-origin/non-browser requests and the configured frontend origins.
      if (!origin) return cb(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        cb(null, true);
        return;
      }

      cb(new Error(`Not allowed: ${origin}`), false);
    },
    credentials: true
  });
  await app.register(sensible);
});
