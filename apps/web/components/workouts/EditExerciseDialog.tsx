'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { UserWorkoutExercise } from '@/types/workouts';

interface EditExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: UserWorkoutExercise;
  onSave: (exerciseId: string, updates: Partial<UserWorkoutExercise>) => Promise<void>;
}

export function EditExerciseDialog({ 
  open, 
  onOpenChange, 
  exercise,
  onSave 
}: EditExerciseDialogProps) {
  const t = useTranslations();
  const [sets, setSets] = useState(exercise.sets ?? 3);
  const [reps, setReps] = useState(exercise.reps ?? 10);
  const [weight, setWeight] = useState<number | undefined>(exercise.weight_kg);
  const [rest, setRest] = useState(exercise.rest_seconds ?? 60);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSets(exercise.sets ?? 3);
    setReps(exercise.reps ?? 10);
    setWeight(exercise.weight_kg);
    setRest(exercise.rest_seconds ?? 60);
  }, [exercise]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(exercise.id, {
        sets,
        reps,
        weight_kg: weight,
        rest_seconds: rest,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workouts.edit_exercise')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              {t('workouts.exercise_name')}
            </label>
            <p className="px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
              {exercise.custom_name || exercise.exercise?.name}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                {t('workouts.sets')}
              </label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                {t('workouts.reps')}
              </label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                {t('workouts.weight')} (kg)
              </label>
              <input
                type="number"
                value={weight || ''}
                onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">
                {t('workouts.rest')} (s)
              </label>
              <input
                type="number"
                value={rest}
                onChange={(e) => setRest(Number(e.target.value))}
                min="0"
                step="5"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 text-foreground transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
