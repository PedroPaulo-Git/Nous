// ========================================
// TIPOS DO SISTEMA DE TREINOS
// ========================================

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'arms' | 'shoulders' | 'core' | 'cardio' | 'rest';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Monday, 7=Sunday

// Exercício pré-definido na biblioteca global
export interface WorkoutExercise {
  id: string;
  name: string;
  name_pt: string;
  category: MuscleGroup;
  description?: string;
  is_active: boolean;
  created_at: string;
}

// Dia de treino do usuário (segunda a domingo)
export interface UserWorkoutDay {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  muscle_group?: MuscleGroup;
  is_rest_day: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  exercises?: UserWorkoutExercise[]; // Incluído ao fazer JOIN
}

// Exercício atribuído a um dia específico
export interface UserWorkoutExercise {
  id: string;
  user_id: string;
  workout_day_id: string;
  exercise_id?: string; // NULL se for customizado
  custom_name?: string; // Usado se exercise_id for NULL
  sets: number;
  reps: number;
  rest_seconds: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
  order_index: number;
  last_completed_at?: string | null; // Timestamp da última conclusão
  created_at: string;
  updated_at: string;
  exercise?: WorkoutExercise; // Incluído ao fazer JOIN com workout_exercises
}

// Log de treino realizado
export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_day_id?: string;
  workout_date: string; // YYYY-MM-DD
  total_duration_minutes?: number;
  exercises_completed: number;
  exercises_total: number;
  notes?: string;
  created_at: string;
  exercises?: WorkoutLogExercise[]; // Incluído ao fazer JOIN
}

// Detalhes de exercício realizado no log
export interface WorkoutLogExercise {
  id: string;
  workout_log_id: string;
  user_workout_exercise_id?: string;
  exercise_name: string;
  sets_completed: number;
  sets_planned: number;
  weight_used_kg?: number;
  notes?: string;
  created_at: string;
}

// DTO para criar/editar dia de treino
export interface CreateWorkoutDayDTO {
  day_of_week: DayOfWeek;
  muscle_group?: MuscleGroup;
  is_rest_day?: boolean;
  notes?: string;
}

// DTO para criar/editar exercício
export interface CreateWorkoutExerciseDTO {
  workout_day_id: string;
  exercise_id?: string; // Se for pré-definido
  custom_name?: string; // Se for customizado
  sets?: number;
  reps?: number;
  rest_seconds?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
  order_index?: number;
}

// DTO para criar log de treino
export interface CreateWorkoutLogDTO {
  workout_day_id?: string;
  workout_date: string;
  total_duration_minutes?: number;
  exercises_completed: number;
  exercises_total: number;
  notes?: string;
  exercises: Array<{
    user_workout_exercise_id?: string;
    exercise_name: string;
    sets_completed: number;
    sets_planned: number;
    weight_used_kg?: number;
    notes?: string;
  }>;
}

// Estatísticas de treino
export interface WorkoutStats {
  total_workouts: number;
  current_streak: number;
  total_duration_minutes: number;
  favorite_muscle_group?: MuscleGroup;
  workouts_this_week: number;
  workouts_this_month: number;
}
