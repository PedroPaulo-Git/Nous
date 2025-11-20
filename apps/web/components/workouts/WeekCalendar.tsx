'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Dumbbell, Activity, Footprints, Zap, Mountain, Wind, Coffee } from 'lucide-react';
import type { UserWorkoutDay } from '@/types/workouts';

interface WeekCalendarProps {
  workoutDays: UserWorkoutDay[];
  selectedDay: UserWorkoutDay | null;
  onSelectDay: (day: UserWorkoutDay) => void;
  onUpdateMuscleGroup: (dayId: string, muscleGroup: string) => void;
}

const MUSCLE_GROUPS = [
  { value: 'chest', icon: Dumbbell, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  { value: 'back', icon: Activity, color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  { value: 'legs', icon: Footprints, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
  { value: 'arms', icon: Zap, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' },
  { value: 'shoulders', icon: Mountain, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' },
  { value: 'core', icon: Activity, color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400' },
  { value: 'cardio', icon: Wind, color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  { value: 'rest', icon: Coffee, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400' },
];

export function WeekCalendar({ workoutDays, selectedDay, onSelectDay, onUpdateMuscleGroup }: WeekCalendarProps) {
  const t = useTranslations();

  const getDayData = (dayOfWeek: number) => {
    return workoutDays.find(d => d.day_of_week === dayOfWeek);
  };

  const getMuscleGroupStyle = (muscleGroup?: string) => {
    const group = MUSCLE_GROUPS.find(g => g.value === (muscleGroup || 'rest'));
    return group || MUSCLE_GROUPS[MUSCLE_GROUPS.length - 1];
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">{t('workouts.week_schedule')}</h2>
      <div className="grid grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
          const dayData = getDayData(dayOfWeek);
          const muscleStyle = getMuscleGroupStyle(dayData?.muscle_group);
          const isSelected = selectedDay?.day_of_week === dayOfWeek;
          const exerciseCount = dayData?.exercises?.length || 0;

          return (
            <button
              key={dayOfWeek}
              onClick={() => dayData && onSelectDay(dayData)}
              className={cn(
                'relative border border-border rounded-lg p-4 transition-all hover:shadow-md bg-card',
                isSelected ? 'ring-2 ring-accent shadow-md' : 'hover:border-accent/50'
              )}
            >
              <div className="text-center space-y-2">
                {/* Dia da semana */}
                <p className="text-xs font-medium text-muted-foreground">
                  {t(`workouts.days.${dayOfWeek}`)}
                </p>
                
                {/* Ícone do grupo muscular */}
                <div className={cn('w-12 h-12 rounded-full mx-auto flex items-center justify-center', muscleStyle.color)}>
                  <muscleStyle.icon className="h-6 w-6" />
                </div>

                {/* Nome do grupo muscular */}
                <p className="text-xs font-medium text-foreground">
                  {t(`workouts.muscle_groups.${dayData?.muscle_group || 'rest'}`)}
                </p>

                {/* Contador de exercícios */}
                {exerciseCount > 0 && (
                  <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {exerciseCount}
                  </div>
                )}
              </div>

              {/* Menu para alterar grupo muscular */}
              {dayData && (
                <select
                  value={dayData.muscle_group || 'rest'}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateMuscleGroup(dayData.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2 left-2 right-2 text-xs border border-border rounded p-1 bg-background text-foreground"
                >
                  {MUSCLE_GROUPS.map(group => (
                    <option key={group.value} value={group.value}>
                      {t(`workouts.muscle_groups.${group.value}`)}
                    </option>
                  ))}
                </select>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
