import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { CreateVaultBody } from '../types/index.js';

const VaultSchema = z.object({ encrypted_blob: z.string().min(10) });

export async function vaultRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  app.get('/', async (req) => {
    const { data, error } = await app.supabase
      .from('password_vault')
      .select('encrypted_blob, updated_at')
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data ?? { encrypted_blob: null, updated_at: null };
  });

  app.put<{ Body: CreateVaultBody }>('/', async (req) => {
    const parsed = VaultSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const { data, error } = await app.supabase
      .from('password_vault')
      // @ts-expect-error - Supabase type inference limitation
      .upsert({ user_id: req.user!.id, encrypted_blob: parsed.data.encrypted_blob, updated_at: new Date().toISOString() })
      .select('encrypted_blob, updated_at')
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });
}
