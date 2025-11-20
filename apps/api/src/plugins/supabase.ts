import fp from 'fastify-plugin';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import type { Database } from '../database.types';

/**
 * Supabase plugin (Service Role) for administrative operations.
 * The service role key MUST be kept secret. This client should only be used
 * for trusted backend tasks (e.g., reading profiles, updating subscription flags).
 */
export default fp(async function supabasePlugin(app: FastifyInstance) {
  const url = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceRoleKey) {
    app.log.error('Missing Supabase env vars');
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  app.decorate('supabase', supabase);
});

declare module 'fastify' {
  interface FastifyInstance {
    supabase: ReturnType<typeof createClient<Database>>;
  }
}
