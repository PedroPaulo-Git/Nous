import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IdParam, DeckIdParam, CreateFlashcardDeckBody, CreateFlashcardBody } from '../types/index.js';

const DeckSchema = z.object({ name: z.string().min(1) });
const UpdateDeckSchema = z.object({ 
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});
const CardSchema = z.object({ front: z.string().min(1), back: z.string().min(1) });
const UpdateCardSchema = z.object({ 
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  hint: z.string().optional(),
});

export async function flashcardsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  // Decks
  app.get('/decks', async (req) => {
    const { data, error } = await app.supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    if (error) throw app.httpErrors.internalServerError(error.message);
    
    // Calculate actual counts for each deck
    const decksWithCounts = await Promise.all(
      (data || []).map(async (deck: any) => {
        const { data: cards } = await app.supabase
          .from('flashcards')
          .select('status')
          .eq('deck_id', deck.id)
          .eq('user_id', req.user!.id);
        
        const cardsArray = (cards as any) || [];
        const newCount = cardsArray.filter((c: any) => c.status === 'new').length || 0;
        const learningCount = cardsArray.filter((c: any) => c.status === 'learning').length || 0;
        const masteredCount = cardsArray.filter((c: any) => c.status === 'mastered').length || 0;
        const totalCount = cardsArray.length || 0;
        
        return {
          ...deck,
          new_count: newCount,
          learning_count: learningCount,
          mastered_count: masteredCount,
          cards_count: totalCount,
        };
      })
    );
    
    return decksWithCounts;
  });

  app.post<{ Body: CreateFlashcardDeckBody }>('/decks', async (req) => {
    const parsed = DeckSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const { data, error } = await app.supabase
      .from('flashcard_decks')
      .insert({ name: parsed.data.name, user_id: req.user!.id })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.patch<{ Params: IdParam; Body: z.infer<typeof UpdateDeckSchema> }>('/decks/:id', async (req) => {
    const { id } = req.params;
    const parsed = UpdateDeckSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    
    const { data, error } = await (app.supabase
      .from('flashcard_decks') as any)
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.delete<{ Params: IdParam }>('/decks/:id', async (req) => {
    const { id } = req.params;
    const { error } = await app.supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });

  // Cards
  app.get<{ Params: DeckIdParam }>('/decks/:deckId/cards', async (req) => {
    const { deckId } = req.params;
    const { data, error } = await app.supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.post<{ Params: DeckIdParam; Body: CreateFlashcardBody }>('/decks/:deckId/cards', async (req) => {
    const { deckId } = req.params;
    const parsed = CardSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    const { data, error } = await app.supabase
      .from('flashcards')
      .insert({ 
        ...parsed.data, 
        deck_id: deckId, 
        user_id: req.user!.id,
        status: 'new',
        ease_factor: 2.5,
        review_interval: 0,
        repetitions: 0,
        next_review_date: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.patch<{ Params: IdParam; Body: z.infer<typeof UpdateCardSchema> }>('/cards/:id', async (req) => {
    const { id } = req.params;
    const parsed = UpdateCardSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);
    
    const { data, error } = await (app.supabase
      .from('flashcards') as any)
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    return data;
  });

  app.delete<{ Params: IdParam }>('/cards/:id', async (req) => {
    const { id } = req.params;
    const { error } = await app.supabase
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true };
  });

  // ========================================
  // ENDPOINT: Reset do timer de revisão
  // ========================================
  // Força o cartão a ficar disponível imediatamente (next_review_date = now)
  // Usado quando usuário quer revisar antes do tempo
  // ========================================
  app.patch<{ Params: IdParam }>('/cards/:id/reset-timer', async (req) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    
    const { error } = await (app.supabase
      .from('flashcards') as any)
      .update({ next_review_date: now })
      .eq('id', id)
      .eq('user_id', req.user!.id);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    return { success: true, message: 'Timer reset - card available now' };
  });

  // --- Extras: Due cards, Reviews, Study Sessions, Stats ---

  // ========================================
  // ENDPOINT: Cartões disponíveis para estudo
  // ========================================
  // Retorna apenas cartões "new" OU "learning" com timer vencido
  // Se nenhum disponível, retorna próximo horário e lista de espera
  // ========================================
  app.get<{ Params: DeckIdParam }>("/decks/:deckId/due", async (req) => {
    const { deckId } = req.params;
    const nowIso = new Date().toISOString();
    
    // Buscar cartões new + learning com timer vencido
    const { data: dueCards, error } = await app.supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', req.user!.id)
      .eq('is_suspended', false)
      .or(`status.eq.new,and(status.eq.learning,next_review_date.lte.${nowIso})`)
      .order('next_review_date', { ascending: true })
      .limit(100);
    
    if (error) throw app.httpErrors.internalServerError(error.message);

    // Se há cartões disponíveis, retorna
    if (dueCards && dueCards.length > 0) {
      return {
        available: true,
        count: dueCards.length,
        cards: dueCards,
        next_available_at: null,
        waiting: []
      };
    }

    // Se não há cartões disponíveis, buscar próximos em learning
    const { data: waitingCards } = await app.supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', req.user!.id)
      .eq('status', 'learning')
      .gt('next_review_date', nowIso)
      .order('next_review_date', { ascending: true })
      .limit(10);

    const waiting = (waitingCards || []).map((c: any) => ({
      id: c.id,
      front: c.front,
      next_review_date: c.next_review_date,
      interval_minutes: c.review_interval,
    }));

    return {
      available: false,
      count: 0,
      cards: [],
      next_available_at: waiting.length > 0 ? waiting[0].next_review_date : null,
      waiting,
    };
  });

  // Review a card (SM-2 scheduling)
  const ReviewSchema = z.object({
    rating: z.enum(['again', 'hard', 'good', 'easy']),
    response_time_seconds: z.number().int().min(0).optional(),
    session_id: z.string().uuid().optional(),
  });

  app.post<{ Params: IdParam; Body: z.infer<typeof ReviewSchema> }>("/cards/:id/review", async (req) => {
    const { id } = req.params;
    const parsed = ReviewSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    // Fetch current card
    const { data: card, error: fetchErr } = await app.supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (fetchErr) throw app.httpErrors.internalServerError(fetchErr.message);
    if (!card) throw app.httpErrors.notFound('Card not found');

    const rating = parsed.data.rating;
    const quality = rating === 'again' ? 0 : rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;

    // ========================================
    // SISTEMA DE REVISÃO ESPAÇADA POR TEMPO
    // ========================================
    // Intervalos reais baseados em minutos/dias conforme rating:
    // - again (falhou): 1 minuto → status "learning"
    // - hard (difícil): 6 minutos → status "learning"  
    // - good (bom): 10 minutos → status "learning"
    // - easy (fácil): 4 dias → status "mastered"
    //
    // Lógica:
    // 1. Cartões começam como "new"
    // 2. Primeira revisão correta (hard/good) → "learning" com timer
    // 3. Primeira revisão "easy" → "mastered" direto (4 dias)
    // 4. Falha (again) → volta para "learning" (1 min)
    // 5. Apenas cartões "new" ou "learning" com timer vencido aparecem
    // ========================================

    const oldEF: number = (card as any).ease_factor ?? 2.5;
    const oldInterval: number = (card as any).review_interval ?? 0;
    const oldReps: number = (card as any).repetitions ?? 0;
    const oldStatus: string = (card as any).status ?? 'new';

    // Atualizar Ease Factor (SM-2 padrão)
    let newEF = oldEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3) newEF = 1.3;

    let newInterval: number; // em MINUTOS (exceto easy que é em dias)
    let newReps: number;
    let status: 'new' | 'learning' | 'review' | 'mastered';

    const now = new Date();

    if (rating === 'again') {
      // ❌ FALHOU: 1 minuto, volta para learning, reseta repetições
      newInterval = 1; // 1 minuto
      newReps = 0;
      status = 'learning';
    } else if (rating === 'easy') {
      // ⭐ FÁCIL: 4 dias, promove direto para mastered (não aparece mais até 4 dias)
      newInterval = 4 * 24 * 60; // 4 dias em minutos
      newReps = oldReps + 1;
      status = 'mastered';
    } else if (rating === 'hard') {
      // 🟡 DIFÍCIL: 6 minutos, fica em learning
      newInterval = 6; // 6 minutos
      newReps = oldReps + 1;
      status = 'learning';
    } else {
      // ✅ BOM: 10 minutos, fica em learning
      newInterval = 10; // 10 minutos
      newReps = oldReps + 1;
      status = 'learning';
    }

    // Calcular próxima data de revisão (now + intervalo em minutos)
    const nextReview = new Date(now.getTime() + newInterval * 60 * 1000).toISOString();

    // Atualizar card no banco
    const updated = {
      ease_factor: newEF,
      review_interval: newInterval, // armazenado em MINUTOS
      repetitions: newReps,
      next_review_date: nextReview,
      status,
      times_reviewed: ((card as any).times_reviewed ?? 0) + 1,
      times_correct: ((card as any).times_correct ?? 0) + (quality >= 3 ? 1 : 0),
      times_wrong: ((card as any).times_wrong ?? 0) + (quality < 3 ? 1 : 0),
      last_reviewed_at: now.toISOString(),
    } as const;

    const { error: updErr } = await (app.supabase
      .from('flashcards') as any)
      .update(updated)
      .eq('id', id)
      .eq('user_id', req.user!.id);
    if (updErr) throw app.httpErrors.internalServerError(updErr.message);

    // Inserir histórico de revisão
    const { error: insErr } = await app.supabase
      .from('flashcard_reviews')
      .insert({
        user_id: req.user!.id,
        flashcard_id: id,
        session_id: parsed.data.session_id ?? null,
        rating,
        was_correct: quality >= 3,
        response_time_seconds: parsed.data.response_time_seconds ?? null,
        ease_factor_before: oldEF,
        ease_factor_after: newEF,
        interval_before: oldInterval,
        interval_after: newInterval,
      } as any);
    if (insErr) throw app.httpErrors.internalServerError(insErr.message);

    return { success: true, next_review_date: nextReview, status, interval_minutes: newInterval };
  });

  // ========================================
  // ENDPOINT: Criar sessão de estudo
  // ========================================
  // Salva a sessão no banco e atualiza estatísticas do usuário
  // 
  // IMPORTANTE: cards_studied deve ser o número REAL de cartões revisados,
  // não o total de navegações ou cliques. Incrementar apenas quando
  // o usuário avaliar um cartão (again/hard/good/easy).
  // ========================================
  const SessionSchema = z.object({
    deck_id: z.string().uuid().optional(),
    session_type: z.enum(['new', 'review', 'cram', 'mixed']).default('mixed'),
    started_at: z.coerce.date(),
    ended_at: z.coerce.date().optional(),
    duration_seconds: z.number().int().min(0).optional(),
    cards_studied: z.number().int().min(0).default(0),
    cards_correct: z.number().int().min(0).default(0),
    cards_wrong: z.number().int().min(0).default(0),
    cards_skipped: z.number().int().min(0).default(0),
    accuracy_percentage: z.number().min(0).max(100).optional(),
  });

  app.post<{ Body: z.infer<typeof SessionSchema> }>("/sessions", async (req) => {
    const parsed = SessionSchema.safeParse(req.body);
    if (!parsed.success) throw app.httpErrors.badRequest(parsed.error.message);

    // Insert session
    const sessionBody = {
      user_id: req.user!.id,
      deck_id: parsed.data.deck_id ?? null,
      session_type: parsed.data.session_type,
      started_at: parsed.data.started_at,
      ended_at: parsed.data.ended_at ?? new Date(),
      duration_seconds: parsed.data.duration_seconds ?? null,
      cards_studied: parsed.data.cards_studied,
      cards_correct: parsed.data.cards_correct,
      cards_wrong: parsed.data.cards_wrong,
      cards_skipped: parsed.data.cards_skipped,
      accuracy_percentage: parsed.data.accuracy_percentage ?? null,
      is_daily_goal_completed: false,
    };
    const { data: session, error: sErr } = await app.supabase
      .from('study_sessions')
      .insert(sessionBody as any)
      .select()
      .maybeSingle();
    if (sErr) throw app.httpErrors.internalServerError(sErr.message);

    // Upsert user_study_stats
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const { data: stats } = await app.supabase
      .from('user_study_stats')
      .select('*')
      .eq('user_id', req.user!.id)
      .maybeSingle();
    const s: any = stats ?? null;

    let current_streak = s?.current_streak ?? 0;
    let longest_streak = s?.longest_streak ?? 0;
    const last_date = s?.last_study_date as string | null;
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (!last_date) {
      current_streak = 1;
      longest_streak = Math.max(longest_streak, current_streak);
    } else if (last_date === todayDate) {
      // same day, keep streak
    } else if (last_date === yesterday) {
      current_streak += 1;
      longest_streak = Math.max(longest_streak, current_streak);
    } else {
      current_streak = 1; // reset
    }

  const total_cards_studied = (s?.total_cards_studied ?? 0) + (parsed.data.cards_studied ?? 0);
  const total_study_time_seconds = (s?.total_study_time_seconds ?? 0) + (parsed.data.duration_seconds ?? 0);
  const total_sessions = (s?.total_sessions ?? 0) + 1;

  const daily_cards_goal = s?.daily_cards_goal ?? 20;
    const todayStudiedIncrement = parsed.data.cards_studied ?? 0;
    // For simplicity, we mark goal completed if session alone meets threshold
    const is_daily_goal_completed = todayStudiedIncrement >= daily_cards_goal;

    if (!stats) {
      const { error: ins } = await app.supabase.from('user_study_stats').insert({
        user_id: req.user!.id,
        current_streak,
        longest_streak,
        last_study_date: todayDate,
        total_cards_studied,
        total_study_time_seconds,
        total_sessions,
        overall_accuracy: 0,
      } as any);
      if (ins) throw app.httpErrors.internalServerError(ins.message);
    } else {
      const { error: upd } = await (app.supabase
        .from('user_study_stats') as any)
        .update({
          current_streak,
          longest_streak,
          last_study_date: todayDate,
          total_cards_studied,
          total_study_time_seconds,
          total_sessions,
        } as any)
        .eq('user_id', req.user!.id);
      if (upd) throw app.httpErrors.internalServerError(upd.message);
    }

    return { success: true, session };
  });

  // Stats for the current user
  app.get('/stats', async (req) => {
    const { data, error } = await app.supabase
      .from('user_study_stats')
      .select('*')
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (error) throw app.httpErrors.internalServerError(error.message);
    if (!data) {
      // create default row
      const { data: created, error: ins } = await app.supabase
        .from('user_study_stats')
        .insert({ user_id: req.user!.id } as any)
        .select()
        .maybeSingle();
      if (ins) throw app.httpErrors.internalServerError(ins.message);
      return created;
    }
    return data;
  });

  // Get today's studied cards count
  app.get('/stats/today', async (req) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await app.supabase
      .from('study_sessions')
      .select('cards_studied')
      .eq('user_id', req.user!.id)
      .gte('started_at', `${today}T00:00:00Z`)
      .lte('started_at', `${today}T23:59:59Z`);
    
    if (error) throw app.httpErrors.internalServerError(error.message);
    
    const total = (data as any)?.reduce((sum: number, session: any) => sum + (session.cards_studied || 0), 0) || 0;
    return { today_studied: total };
  });
}

