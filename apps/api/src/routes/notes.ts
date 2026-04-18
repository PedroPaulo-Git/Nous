import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IdParam, CreateNoteBody, UpdateNoteBody } from '../types/index.js';
import { getPlanLimitError } from '../lib/plan-limits.js';

const NoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1)
});

export async function notesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  app.get('/', async (req) => {
    const { data, error } = await app.supabase
      .from('notes')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('updated_at', { ascending: false });
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.post<{ Body: CreateNoteBody }>('/', async (req, reply) => {
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const limitError = await getPlanLimitError(app, req, 'notes');
    if (limitError) return reply.code(limitError.statusCode).send(limitError);
    const { data, error } = await app.supabase
      .from('notes')
      .insert({ ...parsed.data, user_id: req.user!.id })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.put<{ Params: IdParam; Body: UpdateNoteBody }>('/:id', async (req) => {
    const { id } = req.params;
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const updateData = { ...parsed.data, updated_at: new Date().toISOString() };
    const { data, error } = await app.supabase
      .from('notes')
      .update(updateData)
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
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });
}
