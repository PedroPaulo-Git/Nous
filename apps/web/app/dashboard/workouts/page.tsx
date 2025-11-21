'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dumbbell, Plus, TrendingUp, Calendar, Flame, ClockIcon, Trash2, Pencil, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeekCalendar } from '@/components/workouts/WeekCalendar';
import { AddExerciseDialog } from '@/components/workouts/AddExerciseDialog';
import { EditExerciseDialog } from '@/components/workouts/EditExerciseDialog';
import { WorkoutTimer } from '@/components/workouts/WorkoutTimer';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { getToken, API_URL } from '@/lib/api';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import type { 
  UserWorkoutDay, 
  UserWorkoutExercise, 
  WorkoutExercise, 
  WorkoutStats 
} from '@/types/workouts';

export default function WorkoutsPage() {
  const router = useRouter();
  const t = useTranslations();
  
  // ========================================
  // STATE
  // ========================================
  const [workoutDays, setWorkoutDays] = useState<UserWorkoutDay[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<WorkoutExercise[]>([]);
  const [selectedDay, setSelectedDay] = useState<UserWorkoutDay | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<UserWorkoutExercise[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<UserWorkoutExercise | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // ========================================
  // FETCH DATA
  // ========================================
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await initializeWorkoutSystem();
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  async function initializeWorkoutSystem() {
    try {
      await fetchExerciseLibrary();
      await createDefaultWorkoutDays();
      await fetchWorkoutDays();
      await fetchStats();
    } catch (error) {
      console.error('Error initializing workout system:', error);
      toast.error(t('common.error'), {
        description: 'Failed to load workout data'
      });
    }
  }

  async function createDefaultWorkoutDays() {
    try {
      const token = await getToken();
      // Criar os 7 dias da semana (segunda a domingo)
      for (let day = 1; day <= 7; day++) {
        await fetch(`${API_URL}/workouts/days`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            day_of_week: day,
            muscle_group: 'rest',
            is_rest_day: false,
          }),
        });
      }
    } catch (error) {
      // Ignorar erro se dias já existirem
      console.log('Days already exist or error creating them');
    }
  }

  async function fetchWorkoutDays() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/days`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch workout days');
      const data = await res.json();
      setWorkoutDays(data);
      
      // Selecionar dia atual automaticamente
      const today = new Date().getDay() || 7; // 0=Sunday → 7
      const todayWorkout = data.find((d: UserWorkoutDay) => d.day_of_week === today);
      if (todayWorkout) {
        setSelectedDay(todayWorkout);
        setSelectedExercises(todayWorkout.exercises || []);
      }
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchExerciseLibrary() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch exercise library');
      const data = await res.json();
      setExerciseLibrary(data);
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  async function fetchStats() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }

  // ========================================
  // HANDLERS
  // ========================================
  async function handleDaySelect(day: UserWorkoutDay) {
    setSelectedDay(day);
    setSelectedExercises(day.exercises || []);
    toast.success(t('workouts.day_selected'), {
      description: t(`workouts.days.${day.day_of_week}`)
    });
  }

  async function handleUpdateMuscleGroup(dayId: string, muscleGroup: string) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/days/${dayId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ muscle_group: muscleGroup }),
      });
      if (!res.ok) throw new Error('Failed to update muscle group');
      await fetchWorkoutDays();
      toast.success(t('common.success'), {
        description: t('workouts.muscle_group_updated')
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  async function handleAddExercise(exercise: UserWorkoutExercise) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/exercises`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(exercise),
      });
      if (!res.ok) throw new Error('Failed to add exercise');
      await fetchWorkoutDays();
      setIsAddExerciseOpen(false);
      toast.success(t('common.success'), {
        description: t('workouts.exercise_added')
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    setDeletingId(exerciseId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete exercise');
      await fetchWorkoutDays();
      toast.success(t('common.success'), {
        description: t('workouts.exercise_deleted')
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEditExercise(exerciseId: string, updates: Partial<UserWorkoutExercise>) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update exercise');
      await fetchWorkoutDays();
      setEditingExercise(null);
      toast.success(t('common.success'), {
        description: t('workouts.exercise_updated')
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  async function handleWorkoutComplete(log: any) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/logs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(log),
      });
      if (!res.ok) throw new Error('Failed to save workout log');
      await fetchStats();
      await fetchWorkoutDays(); // Refresh para pegar last_completed_at
      setIsTimerOpen(false);
      setHistoryRefresh(prev => prev + 1); // Trigger history refresh
      toast.success(t('workouts.workout_completed'), {
        description: `${log.exercises_completed}/${log.exercises_total} ${t('workouts.exercises')}`
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  async function handleResetWorkout() {
    if (!selectedDay) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workouts/days/${selectedDay.id}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to reset workout');
      await fetchWorkoutDays();
      toast.success(t('common.success'), {
        description: t('workouts.workout_reset')
      });
    } catch (error: any) {
      toast.error(t('common.error'), {
        description: error.message
      });
    }
  }

  // Checar se algum exercício foi completado hoje
  function hasCompletedToday(): boolean {
    if (!selectedExercises.length) return false;
    const today = new Date().toISOString().slice(0, 10);
    return selectedExercises.some(ex => {
      if (!ex.last_completed_at) return false;
      const completedDate = ex.last_completed_at.slice(0, 10);
      return completedDate === today;
    });
  }

  function isExerciseCompletedToday(exercise: UserWorkoutExercise): boolean {
    if (!exercise.last_completed_at) return false;
    const today = new Date().toISOString().slice(0, 10);
    const completedDate = exercise.last_completed_at.slice(0, 10);
    return completedDate === today;
  }

  // ========================================
  // RENDER
  // ========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center ">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-20 lg:pt-6 space-y-6">
      <div className=" ">
        {/* ========================================
            HEADER
            ======================================== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('workouts.title')}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('workouts.subtitle')}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4" />
              {t('workouts.history')}
            </Button>
          </div>
        </div>

        {/* ========================================
            STATS CARDS
            ======================================== */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>{t('workouts.stats.total_workouts')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.total_workouts}</p>
                  <TrendingUp className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>{t('workouts.stats.current_streak')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.current_streak}</p>
                  <Flame className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>{t('workouts.stats.this_week')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{stats.workouts_this_week}</p>
                  <Calendar className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardDescription>{t('workouts.stats.total_duration')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-foreground">{Math.floor(stats.total_duration_minutes / 60)}h</p>
                  <ClockIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* ========================================
          WEEK CALENDAR
          ======================================== */}
      <WeekCalendar
        workoutDays={workoutDays}
        selectedDay={selectedDay}
        onSelectDay={handleDaySelect}
        onUpdateMuscleGroup={handleUpdateMuscleGroup}
      />

      {/* ========================================
          SELECTED DAY EXERCISES
          ======================================== */}
      {selectedDay && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl">
                  {t(`workouts.days.${selectedDay.day_of_week}`)} - {t(`workouts.muscle_groups.${selectedDay.muscle_group || 'rest'}`)}
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  {t('workouts.click_add_to_start')}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsAddExerciseOpen(true)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sm:inline">{t('workouts.add_exercise')}</span>
                </Button>
                {selectedExercises.length > 0 && (
                  <>
                    {hasCompletedToday() ? (
                      <Button
                        onClick={handleResetWorkout}
                        variant="default"
                        className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 w-full sm:w-auto"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="sm:inline">{t('workouts.reset_workout')}</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsTimerOpen(true)}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        {t('workouts.start_workout')}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedExercises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t('workouts.no_exercises')}</p>
                <p className="text-sm mt-2">{t('workouts.click_add_hint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`border border-border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isExerciseCompletedToday(exercise) ? 'bg-green-50 dark:bg-green-950/20' : ''
                    }`}
                  >
                    <div className="flex-1 flex items-start sm:items-center gap-3 w-full">
                      {isExerciseCompletedToday(exercise) && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                          {exercise.custom_name || exercise.exercise?.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          {exercise.sets && <span>{exercise.sets} {t('workouts.sets')}</span>}
                          {exercise.reps && <span>{exercise.reps} {t('workouts.reps')}</span>}
                          {exercise.weight_kg && <span>{exercise.weight_kg}kg</span>}
                          {exercise.rest_seconds !== undefined && exercise.rest_seconds > 0 && <span>{exercise.rest_seconds}s {t('workouts.rest')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button
                        onClick={() => setEditingExercise(exercise)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === exercise.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================
          HISTORY
          ======================================== */}
      {showHistory && <WorkoutHistory refreshTrigger={historyRefresh} />}

      {/* ========================================
          DIALOGS
          ======================================== */}
      <AddExerciseDialog
        open={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        workoutDayId={selectedDay?.id || ''}
        exerciseLibrary={exerciseLibrary}
        onAdd={handleAddExercise}
      />

      {/* Edit Exercise Dialog */}
      {editingExercise && (
        <EditExerciseDialog
          open={!!editingExercise}
          onOpenChange={(open: boolean) => !open && setEditingExercise(null)}
          exercise={editingExercise}
          onSave={handleEditExercise}
        />
      )}

      <WorkoutTimer
        open={isTimerOpen}
        onOpenChange={setIsTimerOpen}
        exercises={selectedExercises}
        workoutDay={selectedDay}
        onComplete={handleWorkoutComplete}
      />
      </div>
    </div>
  );
}
