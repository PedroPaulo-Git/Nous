"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Plus, Trash2, Play, ArrowLeft, ArrowRight, RotateCw, Loader2, CheckCircle2, Award, TrendingUp, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import type { Flashcard, Deck, StudySession } from "@/types/flashcards";
import { DeckActionsMenu } from "@/components/flashcards/DeckActionsMenu";
import { WaitingCardsDialog } from "@/components/flashcards/WaitingCardsDialog";

interface WaitingCard {
  id: string;
  front: string;
  next_review_date: string;
  interval_minutes: number;
}

export default function FlashcardsPage() {
  const t = useTranslations();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Waiting cards dialog
  const [waitingDialogOpen, setWaitingDialogOpen] = useState(false);
  const [waitingCards, setWaitingCards] = useState<WaitingCard[]>([]);
  const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(null);
  const [waitingDeckName, setWaitingDeckName] = useState("");

  // Form states
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");

  // Stats
  const [dailyStreak, setDailyStreak] = useState(0);
  const [todayStudied, setTodayStudied] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(20);

  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    await Promise.all([fetchDecks(), fetchUserStats()]);
  };

  const authHeader = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` } as HeadersInit;
  };

  const fetchUserStats = async () => {
    try {
      const headers = await authHeader();
      const res = await fetch(`${API_URL}/flashcards/stats`, { headers });
      if (res.ok) {
        const stats = await res.json();
        setDailyStreak(stats.current_streak || 0);
        setDailyGoal(stats.daily_cards_goal || 20);
      }
      
      // Fetch today's studied count separately
      const todayRes = await fetch(`${API_URL}/flashcards/stats/today`, { headers });
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayStudied(todayData.today_studied || 0);
      }
    } catch (e) {
      // silent
    }
  };

  const fetchDecks = async () => {
    try {
      const headers = await authHeader();
      const response = await fetch(`${API_URL}/flashcards/decks`, { headers });
      if (!response.ok) throw new Error("Failed to fetch decks");
      const decksData = await response.json();

      // Fetch cards for each deck
      const decksWithCards: Deck[] = await Promise.all(
        decksData.map(async (deck: Deck) => {
          const cardsResponse = await fetch(`${API_URL}/flashcards/decks/${deck.id}/cards`, { headers });
          const cards = cardsResponse.ok ? await cardsResponse.json() : [];
          return { ...deck, flashcards: cards };
        })
      );
      setDecks(decksWithCards);
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async () => {
    if (!deckName.trim()) {
      toast.error(t("common.error"));
      return;
    }
    setSaving(true);
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/flashcards/decks`, {
        method: 'POST', headers, body: JSON.stringify({ name: deckName, description: deckDescription || undefined })
      });
      if (!response.ok) throw new Error('Failed to create deck');
      toast.success(t("common.success"));
      setDeckDialogOpen(false);
      setDeckName("");
      setDeckDescription("");
      fetchDecks();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally { setSaving(false); }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      const headers = await authHeader();
      await fetch(`${API_URL}/flashcards/decks/${deckId}`, { method: 'DELETE', headers });
      toast.success(t("common.success"));
      fetchDecks();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const createCard = async () => {
    if (!selectedDeck || !question.trim() || !answer.trim()) {
      toast.error(t("common.error"));
      return;
    }
    setSaving(true);
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/flashcards/decks/${selectedDeck.id}/cards`, {
        method: 'POST', headers, body: JSON.stringify({ front: question, back: answer, hint: hint || undefined })
      });
      if (!response.ok) throw new Error('Failed to create card');
      toast.success(t("common.success"));
      setCardDialogOpen(false);
      setQuestion(""); setAnswer(""); setHint("");
      fetchDecks();
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    } finally { setSaving(false); }
  };

  const startStudy = async (deck: Deck) => {
    if (!deck.flashcards || deck.flashcards.length === 0) {
      toast.error(t("flashcards.no_cards"));
      return;
    }

    // Buscar cartões disponíveis (new + learning com timer vencido)
    try {
      const headers = await authHeader();
      const response = await fetch(`${API_URL}/flashcards/decks/${deck.id}/due`, { headers });
      if (!response.ok) throw new Error('Failed to fetch due cards');
      
      const dueData = await response.json();
      
      if (!dueData.available || dueData.count === 0) {
        // Nenhum cartão disponível - mostrar dialog de espera
        setWaitingCards(dueData.waiting || []);
        setNextAvailableAt(dueData.next_available_at);
        setWaitingDeckName(deck.name);
        setWaitingDialogOpen(true);
        return;
      }

      // Iniciar sessão com os cartões disponíveis
      const session: StudySession = {
        deck_id: deck.id,
        session_type: 'mixed',
        started_at: new Date(),
        cards_studied: 0,
        cards_correct: 0,
        cards_wrong: 0,
        cards_skipped: 0,
      };
      setStudySession(session);
      setSelectedDeck({ ...deck, flashcards: dueData.cards });
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setCardStartTime(new Date());
      setStudyMode(true);
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const handleResetTimer = async (cardId: string) => {
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      const response = await fetch(`${API_URL}/flashcards/cards/${cardId}/reset-timer`, {
        method: 'PATCH',
        headers,
      });
      if (!response.ok) throw new Error('Failed to reset timer');
      toast.success("Timer reset! Card is now available.");
    } catch (error: any) {
      toast.error(t("common.error"), { description: error.message });
    }
  };

  const refreshWaitingList = () => {
    setWaitingDialogOpen(false);
    fetchDecks();
  };

  const submitReview = async (cardId: string, rating: 'again'|'hard'|'good'|'easy', responseTimeSec: number, sessionId?: string) => {
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/flashcards/cards/${cardId}/review`, {
        method: 'POST', headers, body: JSON.stringify({ rating, response_time_seconds: responseTimeSec, session_id: sessionId })
      });
    } catch (e) {
      // log-only
      console.error(e);
    }
  };

  const handleCardRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!selectedDeck || !studySession || submittingRating) return;
    
    setSubmittingRating(true);
    try {
      const currentCard = selectedDeck.flashcards[currentCardIndex];
      const responseTime = Math.floor((Date.now() - cardStartTime.getTime()) / 1000);
      const wasCorrect = rating !== 'again';

      // ========================================
      // INCREMENTO DO CONTADOR DIÁRIO
      // ========================================
      // cards_studied++ acontece APENAS aqui, quando o usuário
      // AVALIA um cartão (clica em again/hard/good/easy).
      // NÃO incrementar ao navegar entre cards ou virar o card.
      // ========================================
      const updatedSession = {
        ...studySession,
        cards_studied: studySession.cards_studied + 1,
        cards_correct: wasCorrect ? studySession.cards_correct + 1 : studySession.cards_correct,
        cards_wrong: !wasCorrect ? studySession.cards_wrong + 1 : studySession.cards_wrong,
      };
      setStudySession(updatedSession);

      await submitReview(currentCard.id, rating, responseTime, studySession.id);

      if (currentCardIndex < selectedDeck.flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setCardStartTime(new Date());
      } else {
        await finishStudySession(updatedSession);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const finishStudySession = async (session: StudySession) => {
    const duration = Math.floor((Date.now() - session.started_at.getTime()) / 1000);
    const accuracy = session.cards_studied > 0 ? Math.round((session.cards_correct / session.cards_studied) * 100) : 0;
    
    // ========================================
    // SALVAR SESSÃO E ATUALIZAR STATS
    // ========================================
    // 1. Envia sessão para backend (POST /sessions)
    // 2. Backend salva na tabela study_sessions
    // 3. Backend atualiza user_study_stats (total_cards_studied, streak, etc)
    // 4. Aguardamos fetchUserStats() para pegar valores atualizados
    // 5. Mostramos tela de resultados com contagem correta
    // ========================================
    try {
      const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/flashcards/sessions`, {
        method: 'POST', headers, body: JSON.stringify({ ...session, ended_at: new Date(), duration_seconds: duration, accuracy_percentage: accuracy })
      });
    } catch (e) {
      console.error(e);
    }
    
    // Atualizar stats ANTES de mostrar resultados para garantir contagem correta
    await fetchUserStats();
    
    setStudyMode(false);
    setShowResults(true);
  };

  const repeatStudy = () => {
    setShowResults(false);
    if (selectedDeck) startStudy(selectedDeck);
  };

  const exitStudy = () => {
    setShowResults(false);
    setSelectedDeck(null);
    fetchDecks();
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setCardStartTime(new Date());
    }
  };
  const nextCard = () => {
    if (selectedDeck && currentCardIndex < selectedDeck.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setCardStartTime(new Date());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Results view
  if (showResults && studySession) {
    const accuracy = studySession.cards_studied > 0 ? Math.round((studySession.cards_correct / studySession.cards_studied) * 100) : 0;
    const duration = Math.floor((Date.now() - studySession.started_at.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-card border-border">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-3xl text-foreground">{t("flashcards.study_complete")}</CardTitle>
            <CardDescription className="text-muted-foreground">{t("flashcards.great_job")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 text-center border border-border">
                <p className="text-3xl font-bold text-foreground">{studySession.cards_studied}</p>
                <p className="text-sm text-muted-foreground">{t("flashcards.cards_reviewed")}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border border-border">
                <p className="text-3xl font-bold text-accent">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">{t("flashcards.accuracy")}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border border-border">
                <p className="text-3xl font-bold text-foreground">{minutes}:{seconds.toString().padStart(2, '0')}</p>
                <p className="text-sm text-muted-foreground">{t("flashcards.time_spent")}</p>
              </div>
              <div className="bg-background rounded-lg p-4 text-center border border-border">
                <p className="text-3xl font-bold text-green-500">{studySession.cards_correct}</p>
                <p className="text-sm text-muted-foreground">{t("flashcards.correct")}</p>
              </div>
            </div>
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">{t("flashcards.daily_goal")}</span>
                </div>
                <span className="text-sm text-muted-foreground">{todayStudied}/{dailyGoal}</span>
              </div>
              <Progress value={(todayStudied / dailyGoal) * 100} className="h-2" />
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button onClick={repeatStudy} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <RotateCw className="w-4 h-4 mr-2" /> {t("flashcards.study_again")}
            </Button>
            <Button onClick={exitStudy} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">
              {t("flashcards.exit")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Study mode
  if (studyMode && selectedDeck) {
    const currentCard = selectedDeck.flashcards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / selectedDeck.flashcards.length) * 100;
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setStudyMode(false); setSelectedDeck(null); }} className="border-border text-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t("flashcards.exit_study")}
            </Button>
            <div className="text-muted-foreground">{currentCardIndex + 1} / {selectedDeck.flashcards.length}</div>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{studySession?.cards_correct || 0} ✓</span>
              <span>{studySession?.cards_wrong || 0} ✗</span>
            </div>
          </div>
          <div className="relative h-96">
            <div className={`absolute w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
              <Card className="absolute w-full h-full bg-card border-border flex items-center justify-center p-8 cursor-pointer" style={{ backfaceVisibility: 'hidden' }} onClick={() => !isFlipped && setIsFlipped(true)}>
                <div className="text-center space-y-4">
                  <p className="text-sm text-accent font-medium">{t("flashcards.question")}</p>
                  <p className="text-3xl font-medium text-foreground">{currentCard.front}</p>
                  {currentCard.hint && !isFlipped && (<p className="text-sm text-muted-foreground italic">💡 {currentCard.hint}</p>)}
                  {!isFlipped && (<p className="text-xs text-muted-foreground mt-8">{t("flashcards.click_to_flip")}</p>)}
                </div>
              </Card>
              <Card className="absolute w-full h-full bg-card border-border flex items-center justify-center p-8" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center space-y-4">
                  <p className="text-sm text-accent font-medium">{t("flashcards.answer")}</p>
                  <p className="text-3xl font-medium text-foreground">{currentCard.back}</p>
                </div>
              </Card>
            </div>
          </div>
          {isFlipped ? (
            <div className="grid grid-cols-4 gap-3">
              <Button onClick={() => handleCardRating('again')} disabled={submittingRating} variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10 disabled:opacity-50">
                <XCircle className="w-4 h-4 mr-2" /> {t("flashcards.again")} <span className="text-xs ml-1">&lt;1m</span>
              </Button>
              <Button onClick={() => handleCardRating('hard')} disabled={submittingRating} variant="outline" className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 disabled:opacity-50">
                {t("flashcards.hard")} <span className="text-xs ml-1">~6m</span>
              </Button>
              <Button onClick={() => handleCardRating('good')} disabled={submittingRating} variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500/10 disabled:opacity-50">
                <CheckCircle2 className="w-4 h-4 mr-2" /> {t("flashcards.good")} <span className="text-xs ml-1">~10m</span>
              </Button>
              <Button onClick={() => handleCardRating('easy')} disabled={submittingRating} variant="outline" className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10 disabled:opacity-50">
                {t("flashcards.easy")} <span className="text-xs ml-1">4d</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => setIsFlipped(true)} className="border-border text-foreground hover:bg-muted px-12 py-6 text-lg">
                <RotateCw className="w-5 h-5 mr-2" /> {t("flashcards.show_answer")}
              </Button>
              <Button variant="outline" onClick={prevCard} disabled={currentCardIndex === 0} className="border-border text-foreground hover:bg-muted">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={nextCard} disabled={currentCardIndex === (selectedDeck?.flashcards.length ?? 1) - 1} className="border-border text-foreground hover:bg-muted">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("flashcards.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("flashcards.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {dailyStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">{todayStudied}/{dailyGoal} today</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Dialog open={deckDialogOpen} onOpenChange={setDeckDialogOpen}>
          <DialogTrigger asChild>
            <Card className="border-dashed border-2 border-border hover:border-accent/50 cursor-pointer transition-colors bg-card/50">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
                <Plus className="w-8 h-8 text-accent mb-2" />
                <p className="text-sm font-medium text-foreground">{t("flashcards.create_deck")}</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t("flashcards.create_deck")}</DialogTitle>
              <DialogDescription className="text-muted-foreground">{t("flashcards.create_deck_description")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t("flashcards.deck_name")}</label>
                <Input placeholder={t("flashcards.deck_name_placeholder")}
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="bg-background border-border text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("flashcards.deck_description")}</label>
                <Textarea placeholder={t("flashcards.deck_description_placeholder")}
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="bg-background border-border text-foreground" />
              </div>
              <Button onClick={createDeck} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {decks.map((deck) => (
          <Card key={deck.id} className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color || '#6366f1' }} />
                    {deck.name}
                  </CardTitle>
                  {deck.description && (
                    <CardDescription className="text-muted-foreground mt-1">{deck.description}</CardDescription>
                  )}
                </div>
                <DeckActionsMenu
                  deck={deck}
                  onUpdate={fetchDecks}
                  onDelete={() => deleteDeck(deck.id)}
                  authHeader={authHeader}
                  apiUrl={API_URL}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-background rounded p-2 border border-border">
                  <p className="text-lg font-bold text-foreground">{deck.cards_count || deck.flashcards.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-blue-500/10 rounded p-2 border border-blue-500/20">
                  <p className="text-lg font-bold text-blue-500">{deck.new_count || 0}</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
                <div className="bg-orange-500/10 rounded p-2 border border-orange-500/20">
                  <p className="text-lg font-bold text-orange-500">{deck.learning_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Learning</p>
                </div>
                <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                  <p className="text-lg font-bold text-green-500">{deck.mastered_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => startStudy(deck)} disabled={!deck.flashcards || deck.flashcards.length === 0} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Play className="w-4 h-4 mr-2" /> {t("flashcards.study")}
                </Button>
                <Button onClick={() => { setSelectedDeck(deck); setCardDialogOpen(true); }} variant="outline" className="border-border text-foreground hover:bg-muted">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("flashcards.create_card")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{selectedDeck?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t("flashcards.question")}</label>
              <Textarea placeholder={t("flashcards.question_placeholder")} value={question} onChange={(e) => setQuestion(e.target.value)} className="bg-background border-border text-foreground" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("flashcards.answer")}</label>
              <Textarea placeholder={t("flashcards.answer_placeholder")} value={answer} onChange={(e) => setAnswer(e.target.value)} className="bg-background border-border text-foreground" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("flashcards.hint")} ({t("common.optional")})</label>
              <Input placeholder={t("flashcards.hint_placeholder")} value={hint} onChange={(e) => setHint(e.target.value)} className="bg-background border-border text-foreground" />
            </div>
            <Button onClick={createCard} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WaitingCardsDialog
        open={waitingDialogOpen}
        onOpenChange={setWaitingDialogOpen}
        waiting={waitingCards}
        nextAvailableAt={nextAvailableAt}
        deckName={waitingDeckName}
        onResetTimer={handleResetTimer}
        onRefresh={refreshWaitingList}
      />
    </div>
  );
}
