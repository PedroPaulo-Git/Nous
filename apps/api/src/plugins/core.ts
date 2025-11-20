import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

/**
 * Core Fastify plugins (CORS, sensible defaults).
 */
export default fp(async function core(app) {
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow localhost and configured frontend URL
      if (!origin) return cb(null, true);
      const allowed = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        process.env.FRONTEND_ORIGIN || ''
      ].filter(Boolean);
      if (allowed.includes(origin)) cb(null, true); else cb(new Error('Not allowed'), false);
    },
    credentials: true
  });
  await app.register(sensible);
});
