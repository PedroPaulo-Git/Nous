-- ========================================
-- ADICIONAR RASTREAMENTO DE CONCLUSÃO DE EXERCÍCIOS
-- ========================================
-- Permite rastrear quando cada exercício foi completado
-- pela última vez, para mostrar status visual na UI
-- ========================================

-- Adicionar coluna last_completed_at
ALTER TABLE user_workout_exercises 
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMP WITH TIME ZONE;

-- Índice para performance em consultas de exercícios completados
CREATE INDEX IF NOT EXISTS idx_user_workout_exercises_completed 
ON user_workout_exercises(user_id, last_completed_at);

-- Comentário
COMMENT ON COLUMN user_workout_exercises.last_completed_at IS 'Timestamp da última vez que este exercício foi completado';
