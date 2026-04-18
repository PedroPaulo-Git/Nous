CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TodoRecurrenceType" AS ENUM ('daily', 'weekly', 'monthly', 'yearly', 'custom');

-- CreateEnum
CREATE TYPE "FlashcardStatus" AS ENUM ('new', 'learning', 'review', 'mastered');

-- CreateEnum
CREATE TYPE "FlashcardDifficulty" AS ENUM ('easy', 'normal', 'hard');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('new', 'review', 'cram', 'mixed');

-- CreateEnum
CREATE TYPE "ReviewRating" AS ENUM ('again', 'hard', 'good', 'easy');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('chest', 'back', 'legs', 'arms', 'shoulders', 'core', 'cardio', 'rest');

-- CreateEnum
CREATE TYPE "DrinkWaterSource" AS ENUM ('preset', 'custom');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "due_date" DATE,
    "due_time" TIME(6),
    "start_date" DATE,
    "start_time" TIME(6),
    "priority" "TodoPriority" NOT NULL DEFAULT 'medium',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_type" "TodoRecurrenceType",
    "recurrence_interval" INTEGER DEFAULT 1,
    "recurrence_days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "recurrence_day_of_month" INTEGER,
    "recurrence_end_date" DATE,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "cards_count" INTEGER NOT NULL DEFAULT 0,
    "mastered_count" INTEGER NOT NULL DEFAULT 0,
    "learning_count" INTEGER NOT NULL DEFAULT 0,
    "new_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "deck_id" UUID NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "ease_factor" DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    "review_interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "next_review_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FlashcardStatus" NOT NULL DEFAULT 'new',
    "difficulty" "FlashcardDifficulty" NOT NULL DEFAULT 'normal',
    "times_reviewed" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "times_wrong" INTEGER NOT NULL DEFAULT 0,
    "average_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMPTZ(6),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "deck_id" UUID,
    "session_type" "SessionType" NOT NULL DEFAULT 'review',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "cards_studied" INTEGER NOT NULL DEFAULT 0,
    "cards_correct" INTEGER NOT NULL DEFAULT 0,
    "cards_wrong" INTEGER NOT NULL DEFAULT 0,
    "cards_skipped" INTEGER NOT NULL DEFAULT 0,
    "accuracy_percentage" DECIMAL(5,2),
    "average_response_time" INTEGER,
    "is_daily_goal_completed" BOOLEAN NOT NULL DEFAULT false,
    "streak_day" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "flashcard_id" UUID NOT NULL,
    "session_id" UUID,
    "rating" "ReviewRating" NOT NULL,
    "was_correct" BOOLEAN NOT NULL,
    "response_time_seconds" INTEGER,
    "ease_factor_before" DECIMAL(4,2),
    "ease_factor_after" DECIMAL(4,2),
    "interval_before" INTEGER,
    "interval_after" INTEGER,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_study_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "daily_cards_goal" INTEGER NOT NULL DEFAULT 20,
    "daily_minutes_goal" INTEGER NOT NULL DEFAULT 15,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_study_date" DATE,
    "total_cards_studied" INTEGER NOT NULL DEFAULT 0,
    "total_study_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "overall_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_study_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_vault" (
    "user_id" UUID NOT NULL,
    "encrypted_blob" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_vault_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "passwords" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "website" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "name_pt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_workout_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "muscle_group" "MuscleGroup",
    "is_rest_day" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_workout_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_day_id" UUID,
    "exercise_id" UUID,
    "custom_name" TEXT,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" INTEGER NOT NULL DEFAULT 10,
    "rest_seconds" INTEGER NOT NULL DEFAULT 60,
    "weight_kg" DECIMAL(5,2),
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_day_id" UUID,
    "workout_date" DATE NOT NULL,
    "total_duration_minutes" INTEGER,
    "exercises_completed" INTEGER NOT NULL DEFAULT 0,
    "exercises_total" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_log_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_log_id" UUID NOT NULL,
    "user_workout_exercise_id" UUID,
    "exercise_name" TEXT NOT NULL,
    "sets_completed" INTEGER NOT NULL DEFAULT 0,
    "sets_planned" INTEGER NOT NULL DEFAULT 0,
    "weight_used_kg" DECIMAL(5,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_log_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drinkwater_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "goal_quantity_ml" INTEGER NOT NULL,
    "effective_from" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drinkwater_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drinkwater_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "quantity_ml" INTEGER NOT NULL,
    "when_drink" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "DrinkWaterSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drinkwater_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drinkwater_summary" (
    "user_id" UUID NOT NULL,
    "drinkwater_day" DATE NOT NULL,
    "total_ml" INTEGER NOT NULL DEFAULT 0,
    "goal_ml" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drinkwater_summary_pkey" PRIMARY KEY ("user_id","drinkwater_day")
);

-- CreateTable
CREATE TABLE "drinkwater_streak" (
    "user_id" UUID NOT NULL,
    "streak_current" INTEGER NOT NULL DEFAULT 0,
    "streak_best" INTEGER NOT NULL DEFAULT 0,
    "last_day_check" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drinkwater_streak_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "todos_user_id_idx" ON "todos"("user_id");

-- CreateIndex
CREATE INDEX "flashcard_decks_user_id_idx" ON "flashcard_decks"("user_id");

-- CreateIndex
CREATE INDEX "flashcards_user_id_idx" ON "flashcards"("user_id");

-- CreateIndex
CREATE INDEX "flashcards_deck_id_idx" ON "flashcards"("deck_id");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_idx" ON "study_sessions"("user_id");

-- CreateIndex
CREATE INDEX "flashcard_reviews_user_id_idx" ON "flashcard_reviews"("user_id");

-- CreateIndex
CREATE INDEX "flashcard_reviews_flashcard_id_idx" ON "flashcard_reviews"("flashcard_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_study_stats_user_id_key" ON "user_study_stats"("user_id");

-- CreateIndex
CREATE INDEX "passwords_user_id_idx" ON "passwords"("user_id");

-- CreateIndex
CREATE INDEX "user_workout_days_user_id_idx" ON "user_workout_days"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_workout_days_user_id_day_of_week_key" ON "user_workout_days"("user_id", "day_of_week");

-- CreateIndex
CREATE INDEX "user_workout_exercises_user_id_idx" ON "user_workout_exercises"("user_id");

-- CreateIndex
CREATE INDEX "user_workout_exercises_workout_day_id_idx" ON "user_workout_exercises"("workout_day_id");

-- CreateIndex
CREATE INDEX "workout_logs_user_id_workout_date_idx" ON "workout_logs"("user_id", "workout_date");

-- CreateIndex
CREATE INDEX "workout_log_exercises_workout_log_id_idx" ON "workout_log_exercises"("workout_log_id");

-- CreateIndex
CREATE INDEX "drinkwater_goals_user_id_effective_from_idx" ON "drinkwater_goals"("user_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "drinkwater_goals_user_id_effective_from_key" ON "drinkwater_goals"("user_id", "effective_from");

-- CreateIndex
CREATE INDEX "drinkwater_logs_user_id_when_drink_idx" ON "drinkwater_logs"("user_id", "when_drink" DESC);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_study_stats" ADD CONSTRAINT "user_study_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_vault" ADD CONSTRAINT "password_vault_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_workout_days" ADD CONSTRAINT "user_workout_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_workout_exercises" ADD CONSTRAINT "user_workout_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_workout_exercises" ADD CONSTRAINT "user_workout_exercises_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "user_workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_workout_exercises" ADD CONSTRAINT "user_workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "workout_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "user_workout_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_user_workout_exercise_id_fkey" FOREIGN KEY ("user_workout_exercise_id") REFERENCES "user_workout_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drinkwater_goals" ADD CONSTRAINT "drinkwater_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drinkwater_logs" ADD CONSTRAINT "drinkwater_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drinkwater_summary" ADD CONSTRAINT "drinkwater_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drinkwater_streak" ADD CONSTRAINT "drinkwater_streak_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_todos_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_done = true AND OLD.is_done = false THEN
    NEW.completed_at = NOW();
  ELSIF NEW.is_done = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON "notes"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON "todos"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_todos_completed_at
  BEFORE UPDATE ON "todos"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_todos_completed_at();

CREATE TRIGGER update_flashcard_decks_updated_at
  BEFORE UPDATE ON "flashcard_decks"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON "flashcards"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_study_stats_updated_at
  BEFORE UPDATE ON "user_study_stats"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passwords_updated_at
  BEFORE UPDATE ON "passwords"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_workout_days_updated_at
  BEFORE UPDATE ON "user_workout_days"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_workout_exercises_updated_at
  BEFORE UPDATE ON "user_workout_exercises"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drinkwater_summary_updated_at
  BEFORE UPDATE ON "drinkwater_summary"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drinkwater_streak_updated_at
  BEFORE UPDATE ON "drinkwater_streak"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO "workout_exercises" ("name", "name_pt", "category", "description") VALUES
('Bench Press', 'Supino Reto', 'chest', 'Classic barbell bench press'),
('Incline Bench Press', 'Supino Inclinado', 'chest', 'Incline barbell press'),
('Push-ups', 'Flexoes', 'chest', 'Bodyweight chest exercise'),
('Dumbbell Fly', 'Crucifixo com Halteres', 'chest', 'Chest isolation with dumbbells'),
('Cable Crossover', 'Crucifixo no Cross', 'chest', 'Cable chest fly'),
('Pull-ups', 'Barra Fixa', 'back', 'Bodyweight back exercise'),
('Deadlift', 'Levantamento Terra', 'back', 'Full body compound movement'),
('Bent Over Row', 'Remada Curvada', 'back', 'Barbell row'),
('Lat Pulldown', 'Puxada na Polia', 'back', 'Lat-focused pulldown'),
('Seated Cable Row', 'Remada Sentada', 'back', 'Horizontal pulling'),
('Squat', 'Agachamento', 'legs', 'Barbell back squat'),
('Leg Press', 'Leg Press', 'legs', 'Machine leg press'),
('Lunges', 'Avanco', 'legs', 'Walking or stationary lunges'),
('Leg Curl', 'Mesa Flexora', 'legs', 'Hamstring isolation'),
('Leg Extension', 'Cadeira Extensora', 'legs', 'Quad isolation'),
('Calf Raise', 'Panturrilha em Pe', 'legs', 'Standing calf raise'),
('Overhead Press', 'Desenvolvimento', 'shoulders', 'Barbell shoulder press'),
('Lateral Raise', 'Elevacao Lateral', 'shoulders', 'Dumbbell lateral raise'),
('Front Raise', 'Elevacao Frontal', 'shoulders', 'Front delt raise'),
('Rear Delt Fly', 'Crucifixo Inverso', 'shoulders', 'Rear deltoid isolation'),
('Bicep Curl', 'Rosca Direta', 'arms', 'Barbell or dumbbell curl'),
('Hammer Curl', 'Rosca Martelo', 'arms', 'Neutral grip curl'),
('Tricep Dips', 'Mergulho', 'arms', 'Bodyweight tricep exercise'),
('Tricep Pushdown', 'Triceps na Polia', 'arms', 'Cable tricep extension'),
('Skull Crushers', 'Triceps Testa', 'arms', 'Lying tricep extension'),
('Plank', 'Prancha', 'core', 'Isometric core hold'),
('Crunches', 'Abdominal', 'core', 'Basic ab crunches'),
('Russian Twist', 'Abdominal Russo', 'core', 'Rotational core exercise'),
('Leg Raises', 'Elevacao de Pernas', 'core', 'Lower ab exercise'),
('Mountain Climbers', 'Escalador', 'core', 'Dynamic core exercise'),
('Treadmill', 'Esteira', 'cardio', 'Running or walking'),
('Cycling', 'Bicicleta', 'cardio', 'Stationary or outdoor bike'),
('Rowing Machine', 'Remador', 'cardio', 'Cardio rowing'),
('Jump Rope', 'Pular Corda', 'cardio', 'Skipping rope'),
('Burpees', 'Burpees', 'cardio', 'Full body cardio exercise');

