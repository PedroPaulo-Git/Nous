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

  const connectionCheck = await pool.query<{
    current_database: string;
    current_schema: string;
  }>('SELECT current_database(), current_schema()');
  const databaseInfo = connectionCheck.rows[0];

  app.log.info(
    {
      event: 'database_connected',
      database: databaseInfo.current_database,
      schema: databaseInfo.current_schema,
      poolMax: Number(process.env.DATABASE_POOL_MAX || 10),
    },
    'PostgreSQL connection established'
  );

  const authSchemaCheck = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'auth' AND table_name = 'users'
      ) AS exists
    `
  );

  if (authSchemaCheck.rows[0]?.exists) {
    app.log.info(
      { event: 'auth_storage_ready', table: 'auth.users' },
      'Authentication tables are available'
    );
  } else {
    app.log.warn(
      {
        event: 'auth_storage_missing',
        table: 'auth.users',
        action: 'Run prisma migrate deploy for apps/api on the production database',
      },
      'Authentication tables are missing from the database'
    );
  }

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
