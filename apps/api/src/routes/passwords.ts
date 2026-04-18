import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const PasswordSchema = z.object({
  website: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  category: z.string().min(1),
});

const PasswordUpdateSchema = z.object({
  website: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

export async function passwordsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  // Get all passwords for the current user
  app.get('/', async (req) => {
    const { data, error } = await app.supabase
      .from('passwords')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data ?? [];
  });

  // Create a new password
  app.post<{ Body: z.infer<typeof PasswordSchema> }>('/', async (req) => {
    const parsed = PasswordSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const { data, error } = await app.supabase
      .from('passwords')
      .insert({
        user_id: req.user!.id,
        website: parsed.data.website,
        username: parsed.data.username,
        password: parsed.data.password,
        category: parsed.data.category,
      })
      .select()
      .single();

    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Update a password
  app.put<{ Params: { id: string }; Body: z.infer<typeof PasswordUpdateSchema> }>(
    '/:id',
    async (req) => {
      const parsed = PasswordUpdateSchema.safeParse(req.body);
      if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

      const { data, error } = await app.supabase
        .from('passwords')
        .update(parsed.data)
        .eq('id', req.params.id)
        .eq('user_id', req.user!.id)
        .select()
        .single();

      if (error) throw app.httpErrors.internalServerError(error.message);
      return data;
    }
  );

  // Delete a password
  app.delete<{ Params: { id: string } }>('/:id', async (req) => {
    const { error } = await app.supabase
      .from('passwords')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);

    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });
}
