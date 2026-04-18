import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const CreateWorkoutDaySchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  muscle_group: z.enum(['chest', 'back', 'legs', 'arms', 'shoulders', 'core', 'cardio', 'rest']).optional(),
  is_rest_day: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

const UpdateWorkoutDaySchema = CreateWorkoutDaySchema.partial();

const CreateWorkoutExerciseSchema = z.object({
  workout_day_id: z.string().uuid(),
  exercise_id: z.string().uuid().optional(),
  custom_name: z.string().optional(),
  sets: z.number().int().min(1).optional().default(3),
  reps: z.number().int().min(1).optional().default(10),
  rest_seconds: z.number().int().min(0).optional().default(60),
  weight_kg: z.number().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  notes: z.string().optional(),
  order_index: z.number().int().min(0).optional().default(0),
});

const UpdateWorkoutExerciseSchema = CreateWorkoutExerciseSchema.partial().omit({ workout_day_id: true });

const CreateWorkoutLogSchema = z.object({
  workout_day_id: z.string().uuid().optional(),
  workout_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  total_duration_minutes: z.number().int().min(0).optional(),
  exercises_completed: z.number().int().min(0).default(0),
  exercises_total: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  exercises: z.array(z.object({
    user_workout_exercise_id: z.string().uuid().optional(),
    exercise_name: z.string(),
    sets_completed: z.number().int().min(0).default(0),
    sets_planned: z.number().int().min(0).default(0),
    weight_used_kg: z.number().optional(),
    notes: z.string().optional(),
  })).default([]),
});

// ========================================
// ROTAS
// ========================================

export async function workoutsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  // ========================================
  // EXERCÍCIOS PRÉ-DEFINIDOS (Biblioteca Global)
  // ========================================

  app.get('/exercises', async (req) => {
    const { data, error } = await app.supabase
      .from('workout_exercises')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // ========================================
  // DIAS DE TREINO DO USUÁRIO
  // ========================================

  // Listar todos os dias da semana (com exercícios)
  app.get('/days', async (req) => {
    const { data: days, error } = await app.supabase
      .from('user_workout_days')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('day_of_week', { ascending: true });
    
    if (error) throw app.httpErrors.internalServerError(error.message);

    // Buscar exercícios de cada dia
    const daysWithExercises = await Promise.all(
      (days || []).map(async (day: any) => {
        const { data: exercises } = await app.supabase
          .from('user_workout_exercises')
          .select(`
            *,
            exercise:exercise_id (*)
          `)
          .eq('workout_day_id', day.id)
          .order('order_index', { ascending: true });
        
        return { ...day, exercises: exercises || [] };
      })
    );

    return daysWithExercises;
  });

  // Criar ou atualizar dia de treino
  app.post('/days', async (req) => {
    const parsed = CreateWorkoutDaySchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    // Upsert (atualizar se já existe, criar se não)
    const { data, error } = await (app.supabase
      .from('user_workout_days') as any)
      .upsert({
        user_id: req.user!.id,
        ...parsed.data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,day_of_week'
      })
      .select()
      .maybeSingle();
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Atualizar dia específico
  app.patch('/days/:id', async (req) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateWorkoutDaySchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const { data, error } = await (app.supabase
      .from('user_workout_days') as any)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .maybeSingle();
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Deletar dia de treino
  app.delete('/days/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { error } = await app.supabase
      .from('user_workout_days')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });

  // ========================================
  // EXERCÍCIOS DO USUÁRIO
  // ========================================

  // Adicionar exercício a um dia
  app.post('/exercises', async (req) => {
    const parsed = CreateWorkoutExerciseSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const { data, error } = await (app.supabase
      .from('user_workout_exercises') as any)
      .insert({
        user_id: req.user!.id,
        ...parsed.data,
      })
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .maybeSingle();
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Atualizar exercício
  app.patch('/exercises/:id', async (req) => {
    const { id } = req.params as { id: string };
    const parsed = UpdateWorkoutExerciseSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    const { data, error } = await (app.supabase
      .from('user_workout_exercises') as any)
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .maybeSingle();
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Deletar exercício
  app.delete('/exercises/:id', async (req) => {
    const { id } = req.params as { id: string };
    const { error } = await app.supabase
      .from('user_workout_exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });

  // Marcar exercício como completado
  app.patch('/exercises/:id/complete', async (req) => {
    const { id } = req.params as { id: string };
    
    const { data, error } = await (app.supabase
      .from('user_workout_exercises') as any)
      .update({
        last_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .maybeSingle();
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Resetar todos os exercícios de um dia
  app.post('/days/:id/reset', async (req) => {
    const { id } = req.params as { id: string };
    
    const { error } = await (app.supabase
      .from('user_workout_exercises') as any)
      .update({
        last_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('workout_day_id', id)
      .eq('user_id', req.user!.id);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });

  // ========================================
  // LOGS DE TREINO (Histórico)
  // ========================================

  // Listar logs de treino
  app.get('/logs', async (req) => {
    const { limit = 30 } = req.query as { limit?: number };
    
    const { data, error } = await app.supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('workout_date', { ascending: false })
      .limit(limit);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  // Criar log de treino
  app.post('/logs', async (req) => {
    const parsed = CreateWorkoutLogSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    // Inserir log principal
    const { data: log, error: logError } = await (app.supabase
      .from('workout_logs') as any)
      .insert({
        user_id: req.user!.id,
        workout_day_id: parsed.data.workout_day_id,
        workout_date: parsed.data.workout_date,
        total_duration_minutes: parsed.data.total_duration_minutes,
        exercises_completed: parsed.data.exercises_completed,
        exercises_total: parsed.data.exercises_total,
        notes: parsed.data.notes,
      })
      .select()
      .maybeSingle();
    
    if (logError) throw app.httpErrors.internalServerError(logError.message);

    // Inserir detalhes dos exercícios
    if (parsed.data.exercises.length > 0) {
      const exercisesData = parsed.data.exercises.map(ex => ({
        workout_log_id: log.id,
        ...ex,
      }));

      const { error: exError } = await app.supabase
        .from('workout_log_exercises')
        .insert(exercisesData as any);
      
      if (exError) throw app.httpErrors.internalServerError(exError.message);
    }

    return log;
  });

  // Estatísticas de treino
  app.get('/stats', async (req) => {
    const { data: logs, error } = await app.supabase
      .from('workout_logs')
      .select('workout_date, total_duration_minutes, workout_day_id')
      .eq('user_id', req.user!.id)
      .order('workout_date', { ascending: false });
    
    if (error) throw app.httpErrors.internalServerError(error.message);

    const logsArray = logs || [];
    const totalWorkouts = logsArray.length;
    const totalDuration = logsArray.reduce((sum: number, log: any) => 
      sum + (log.total_duration_minutes || 0), 0);

    // Calcular streak
    let currentStreak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const sortedDates = [...new Set(logsArray.map((l: any) => l.workout_date))].sort().reverse();
    
    if (sortedDates.length > 0 && sortedDates[0] === today) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(String(sortedDates[i - 1]));
        const currDate = new Date(String(sortedDates[i]));
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) currentStreak++;
        else break;
      }
    }

    // Treinos desta semana
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const workoutsThisWeek = logsArray.filter((l: any) => l.workout_date >= weekStartStr).length;

    // Treinos deste mês
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const workoutsThisMonth = logsArray.filter((l: any) => l.workout_date >= monthStartStr).length;

    return {
      total_workouts: totalWorkouts,
      current_streak: currentStreak,
      total_duration_minutes: totalDuration,
      workouts_this_week: workoutsThisWeek,
      workouts_this_month: workoutsThisMonth,
    };
  });
}
