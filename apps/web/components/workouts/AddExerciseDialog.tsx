'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Dumbbell } from 'lucide-react';
import type { WorkoutExercise, UserWorkoutExercise } from '@/types/workouts';

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDayId: string;
  exerciseLibrary: WorkoutExercise[];
  onAdd: (exercise: UserWorkoutExercise) => void;
}

export function AddExerciseDialog({ 
  open, 
  onOpenChange, 
  workoutDayId, 
  exerciseLibrary, 
  onAdd 
}: AddExerciseDialogProps) {
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customName, setCustomName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | undefined>();
  const [rest, setRest] = useState(60);
  const [isAdding, setIsAdding] = useState(false);

  const categories = ['all', ...Array.from(new Set(exerciseLibrary.map(e => e.category)))];

  const filteredExercises = exerciseLibrary.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddFromLibrary = async (exercise: WorkoutExercise) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      await onAdd({
        workout_day_id: workoutDayId,
        exercise_id: exercise.id,
        sets,
        reps,
        rest_seconds: rest,
        weight_kg: weight,
      } as UserWorkoutExercise);
      resetForm();
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddCustom = async () => {
    if (!customName.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAdd({
        workout_day_id: workoutDayId,
        custom_name: customName,
        sets,
        reps,
        rest_seconds: rest,
        weight_kg: weight,
      } as UserWorkoutExercise);
      resetForm();
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setCustomName('');
    setSets(3);
    setReps(10);
    setWeight(undefined);
    setRest(60);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('workouts.add_exercise')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">{t('workouts.from_library')}</TabsTrigger>
            <TabsTrigger value="custom">{t('workouts.custom_exercise')}</TabsTrigger>
          </TabsList>

          {/* ========================================
              BIBLIOTECA DE EXERCÍCIOS
              ======================================== */}
          <TabsContent value="library" className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('workouts.search_exercise')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Filtro de categoria */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t(`workouts.muscle_groups.${cat}`)}
                </button>
              ))}
            </div>

            {/* Lista de exercícios */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => handleAddFromLibrary(exercise)}
                  disabled={isAdding}
                  className="w-full text-left border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="font-medium text-foreground">{exercise.name}</p>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
                    )}
                  </div>
                  <Dumbbell className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </TabsContent>

          {/* ========================================
              EXERCÍCIO CUSTOMIZADO
              ======================================== */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">{t('workouts.exercise_name')}</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder={t('workouts.enter_exercise_name')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">{t('workouts.sets')}</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">{t('workouts.reps')}</label>
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
                  <label className="block text-sm font-medium mb-1 text-foreground">{t('workouts.weight')} (kg)</label>
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
                  <label className="block text-sm font-medium mb-1 text-foreground">{t('workouts.rest')} (s)</label>
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

              <button
                onClick={handleAddCustom}
                disabled={!customName.trim() || isAdding}
                className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isAdding ? t('common.loading') : t('workouts.add_exercise')}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
