import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IdParam, UpdateSubscriptionBody } from '../types/index.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.adminRequired);

  app.get('/users', async () => {
    const { data, error } = await app.supabase
      .from('profiles')
      .select('id,is_subscribed,is_admin,created_at')
      .order('created_at', { ascending: false });
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.patch<{ Params: IdParam; Body: UpdateSubscriptionBody }>('/users/:id/subscription', async (req) => {
    const { id } = req.params;
    const parsed = z.object({ is_subscribed: z.boolean() }).safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const { data, error } = await app.supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference limitation
      .update({ is_subscribed: parsed.data.is_subscribed })
      .eq('id', id)
      .select('id,is_subscribed,is_admin,created_at')
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });
}
