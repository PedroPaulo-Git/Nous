import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IdParam, UpdateSubscriptionBody } from '../types/index.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.adminRequired);

  app.get('/users', async () => {
    const { rows } = await app.db.query<{
      id: string;
      email: string | null;
      is_subscribed: boolean;
      is_admin: boolean;
      created_at: string;
    }>(
      `
        SELECT
          p.id,
          u.email,
          p.is_subscribed,
          p.is_admin,
          p.created_at
        FROM public.profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        ORDER BY p.created_at DESC
      `
    );

    return rows;
  });

  app.patch<{ Params: IdParam; Body: UpdateSubscriptionBody }>('/users/:id/subscription', async (req) => {
    const { id } = req.params;
    const parsed = z.object({ is_subscribed: z.boolean() }).safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const { rows } = await app.db.query<{
      id: string;
      is_subscribed: boolean;
      is_admin: boolean;
      created_at: string;
    }>(
      `
        UPDATE public.profiles
        SET is_subscribed = $2
        WHERE id = $1
        RETURNING id, is_subscribed, is_admin, created_at
      `,
      [id, parsed.data.is_subscribed]
    );

    return rows[0] ?? null;
  });
}
