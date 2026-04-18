import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IdParam } from '../types/index.js';

const TodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  is_done: z.boolean().optional(),
  due_date: z.string().optional().nullable(),
  due_time: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).optional().nullable(),
  recurrence_interval: z.number().int().min(1).optional().nullable(),
  recurrence_days_of_week: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  recurrence_day_of_month: z.number().int().min(1).max(31).optional().nullable(),
  recurrence_end_date: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

export async function todosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  app.get('/', async (req) => {
    const { data, error } = await app.supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.post('/', async (req) => {
    const parsed = TodoSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    
    const { data, error } = await app.supabase
      .from('todos')
      .insert({ 
        ...parsed.data,
        is_done: parsed.data.is_done ?? false,
        priority: parsed.data.priority ?? 'medium',
        user_id: req.user!.id 
      })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.put<{ Params: IdParam }>('/:id', async (req) => {
    const { id } = req.params;
    const parsed = TodoSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    
    const { data, error } = await app.supabase
      .from('todos')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.delete<{ Params: IdParam }>('/:id', async (req) => {
    const { id } = req.params;
    const { error } = await app.supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });
}
