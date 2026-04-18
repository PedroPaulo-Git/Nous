import fp from 'fastify-plugin';
import { Pool } from 'pg';
import type { FastifyInstance } from 'fastify';
import { createPostgresAdapter } from '../lib/postgres-adapter.js';

export default fp(async function postgresPlugin(app: FastifyInstance) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  const pool = new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
  });

  await pool.query('SELECT 1');

  app.decorate('db', pool);
  app.decorate('supabase', createPostgresAdapter(pool));

  app.addHook('onClose', async () => {
    await pool.end();
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    supabase: ReturnType<typeof createPostgresAdapter>;
  }
}
