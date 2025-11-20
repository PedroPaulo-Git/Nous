'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import type { UserWorkoutExercise, UserWorkoutDay } from '@/types/workouts';
import { getToken, API_URL } from '@/lib/api';

interface WorkoutTimerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: UserWorkoutExercise[];
  workoutDay: UserWorkoutDay | null;
  onComplete: (log: any) => void;
}

export function WorkoutTimer({ 
  open, 
  onOpenChange, 
  exercises, 
  workoutDay,
  onComplete 
}: WorkoutTimerProps) {
  const t = useTranslations();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<any[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 3;

  useEffect(() => {
    if (open && !workoutStartTime) {
      setWorkoutStartTime(new Date());
    }
    
    // Reset completo quando modal fecha
    if (!open) {
      resetState();
    }
  }, [open]);

  // Timer para atualizar tempo decorrido
  useEffect(() => {
    if (!workoutStartTime) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [workoutStartTime]);

  useEffect(() => {
    if (!isResting || restTimeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  const handleCompleteSet = () => {
    if (currentSet < totalSets) {
      // Mais séries para fazer
      setCurrentSet(prev => prev + 1);
      // Só ativa descanso se rest_seconds > 0
      if (currentExercise.rest_seconds && currentExercise.rest_seconds > 0) {
        setIsResting(true);
        setRestTimeLeft(currentExercise.rest_seconds);
      }
    } else {
      // Exercício completo
      const completedExercise = {
        user_workout_exercise_id: currentExercise.id,
        exercise_name: currentExercise.custom_name || currentExercise.exercise?.name,
        sets_completed: totalSets,
        sets_planned: totalSets,
        weight_used_kg: currentExercise.weight_kg,
      };
      
      const updatedCompletedExercises = [...completedExercises, completedExercise];
      setCompletedExercises(updatedCompletedExercises);

      // Marcar exercício como completado no backend
      markExerciseAsCompleted(currentExercise.id);

      if (currentExerciseIndex < exercises.length - 1) {
        // Próximo exercício
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setIsResting(false);
      } else {
        // Treino completo! Passa os exercícios completados diretamente
        handleFinishWorkout(updatedCompletedExercises);
      }
    }
  };

  const handleSkipExercise = () => {
    // Registra o exercício como parcialmente completado
    const skippedExercise = {
      user_workout_exercise_id: currentExercise.id,
      exercise_name: currentExercise.custom_name || currentExercise.exercise?.name,
      sets_completed: currentSet - 1, // Sets que foram feitos antes de pular
      sets_planned: totalSets,
      weight_used_kg: currentExercise.weight_kg,
    };
    
    const updatedCompletedExercises = [...completedExercises, skippedExercise];
    setCompletedExercises(updatedCompletedExercises);

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setIsResting(false);
    } else {
      handleFinishWorkout(updatedCompletedExercises);
    }
  };

  const handleFinishWorkout = (finalCompletedExercises?: any[]) => {
    // Usa o parâmetro se fornecido, senão usa o estado
    const exercisesToSave = finalCompletedExercises || completedExercises;
    
    // Precisa ter exercícios completados (pelo menos iniciado)
    if (exercisesToSave.length === 0) {
      // Nenhum exercício foi nem iniciado - não salva
      onOpenChange(false);
      resetState();
      return;
    }

    // Valida se pelo menos 1 set foi completado
    const totalSetsCompleted = exercisesToSave.reduce((sum, ex) => sum + ex.sets_completed, 0);
    
    if (totalSetsCompleted === 0) {
      // Nenhum progresso real - não salva o workout
      onOpenChange(false);
      resetState();
      return;
    }

    const duration = workoutStartTime 
      ? Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 60000)
      : 0;

    // Conta apenas exercícios que tiveram pelo menos 1 set completado
    const exercisesWithProgress = exercisesToSave.filter(ex => ex.sets_completed > 0).length;

    onComplete({
      workout_day_id: workoutDay?.id,
      workout_date: new Date().toISOString().slice(0, 10),
      total_duration_minutes: duration,
      exercises_completed: exercisesWithProgress,
      exercises_total: exercises.length,
      exercises: exercisesToSave,
    });

    // Não resetar aqui - será resetado quando modal fechar via useEffect
  };

  const resetState = () => {
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setIsResting(false);
    setWorkoutStartTime(null);
    setCompletedExercises([]);
    setElapsedTime(0);
  };

  const markExerciseAsCompleted = async (exerciseId: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/workouts/exercises/${exerciseId}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to mark exercise as completed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workouts.workout_in_progress')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progresso */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t('workouts.exercise')} {currentExerciseIndex + 1} {t('common.of')} {exercises.length}
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all"
                style={{ 
                  width: `${(completedExercises.filter(ex => ex.sets_completed > 0).length / exercises.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Exercício atual */}
          <div className="bg-muted/30 rounded-lg p-6 text-center border border-border">
            <h3 className="text-2xl font-bold mb-2 text-foreground">
              {currentExercise.custom_name || currentExercise.exercise?.name}
            </h3>
            <p className="text-4xl font-bold text-accent mb-4">
              {currentSet}/{totalSets}
            </p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              {currentExercise.reps && <span>{currentExercise.reps} {t('workouts.reps')}</span>}
              {currentExercise.weight_kg && <span>{currentExercise.weight_kg}kg</span>}
            </div>
          </div>

          {/* Descanso */}
          {isResting && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">{t('workouts.rest_time')}</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatTime(restTimeLeft)}</p>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleSkipExercise}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 flex items-center justify-center gap-2 text-foreground transition-colors"
              >
                <SkipForward className="h-4 w-4" />
                {t('workouts.skip')}
              </button>
              <button
                onClick={handleCompleteSet}
                disabled={isResting}
                className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                {t('workouts.complete_set')}
              </button>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>

          {/* Estatísticas */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>⏱️ {t('workouts.duration')}: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
            <p>✅ {t('workouts.completed')}: {completedExercises.filter(ex => ex.sets_completed > 0).length}/{exercises.length} {t('workouts.exercises')}</p>
            <p>💪 Sets: {completedExercises.reduce((sum, ex) => sum + ex.sets_completed, 0)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
