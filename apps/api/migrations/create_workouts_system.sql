-- ========================================
-- SISTEMA DE GERENCIAMENTO DE TREINOS
-- ========================================
-- Permite ao usuário criar rotina semanal de exercícios,
-- adicionar exercícios pré-definidos ou customizados,
-- e acompanhar progresso com timer e histórico.
-- ========================================

-- Tabela: Exercícios pré-definidos (biblioteca global)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_pt VARCHAR(255) NOT NULL, -- Nome em português
  category VARCHAR(100) NOT NULL, -- chest, back, legs, arms, shoulders, core, cardio
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Dias de treino do usuário (segunda a domingo)
CREATE TABLE IF NOT EXISTS user_workout_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  muscle_group VARCHAR(100), -- chest, back, legs, arms, shoulders, core, rest
  is_rest_day BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_of_week)
);

-- Tabela: Exercícios atribuídos aos dias do usuário
CREATE TABLE IF NOT EXISTS user_workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_day_id UUID REFERENCES user_workout_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES workout_exercises(id) ON DELETE SET NULL, -- NULL se for custom
  custom_name VARCHAR(255), -- Se não usar exercício pré-definido
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  rest_seconds INTEGER DEFAULT 60, -- Tempo de descanso entre séries
  weight_kg DECIMAL(5,2), -- Peso usado (opcional)
  duration_minutes INTEGER, -- Para cardio ou exercícios com tempo
  notes TEXT,
  order_index INTEGER DEFAULT 0, -- Ordem de execução no dia
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Histórico de treinos realizados
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_day_id UUID REFERENCES user_workout_days(id) ON DELETE SET NULL,
  workout_date DATE NOT NULL,
  total_duration_minutes INTEGER,
  exercises_completed INTEGER DEFAULT 0,
  exercises_total INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: Detalhes de cada exercício realizado no log
CREATE TABLE IF NOT EXISTS workout_log_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  user_workout_exercise_id UUID REFERENCES user_workout_exercises(id) ON DELETE SET NULL,
  exercise_name VARCHAR(255) NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  sets_planned INTEGER DEFAULT 0,
  weight_used_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_workout_days_user ON user_workout_days(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workout_exercises_user ON user_workout_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workout_exercises_day ON user_workout_exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_log ON workout_log_exercises(workout_log_id);

-- ========================================
-- INSERIR EXERCÍCIOS PRÉ-DEFINIDOS
-- ========================================

INSERT INTO workout_exercises (name, name_pt, category, description) VALUES
-- PEITO (Chest)
('Bench Press', 'Supino Reto', 'chest', 'Classic barbell bench press'),
('Incline Bench Press', 'Supino Inclinado', 'chest', 'Incline barbell press'),
('Push-ups', 'Flexões', 'chest', 'Bodyweight chest exercise'),
('Dumbbell Fly', 'Crucifixo com Halteres', 'chest', 'Chest isolation with dumbbells'),
('Cable Crossover', 'Crucifixo no Cross', 'chest', 'Cable chest fly'),

-- COSTAS (Back)
('Pull-ups', 'Barra Fixa', 'back', 'Bodyweight back exercise'),
('Deadlift', 'Levantamento Terra', 'back', 'Full body compound movement'),
('Bent Over Row', 'Remada Curvada', 'back', 'Barbell row'),
('Lat Pulldown', 'Puxada na Polia', 'back', 'Lat-focused pulldown'),
('Seated Cable Row', 'Remada Sentada', 'back', 'Horizontal pulling'),

-- PERNAS (Legs)
('Squat', 'Agachamento', 'legs', 'Barbell back squat'),
('Leg Press', 'Leg Press', 'legs', 'Machine leg press'),
('Lunges', 'Avanço', 'legs', 'Walking or stationary lunges'),
('Leg Curl', 'Mesa Flexora', 'legs', 'Hamstring isolation'),
('Leg Extension', 'Cadeira Extensora', 'legs', 'Quad isolation'),
('Calf Raise', 'Panturrilha em Pé', 'legs', 'Standing calf raise'),

-- OMBROS (Shoulders)
('Overhead Press', 'Desenvolvimento', 'shoulders', 'Barbell shoulder press'),
('Lateral Raise', 'Elevação Lateral', 'shoulders', 'Dumbbell lateral raise'),
('Front Raise', 'Elevação Frontal', 'shoulders', 'Front delt raise'),
('Rear Delt Fly', 'Crucifixo Inverso', 'shoulders', 'Rear deltoid isolation'),

-- BRAÇOS (Arms)
('Bicep Curl', 'Rosca Direta', 'arms', 'Barbell or dumbbell curl'),
('Hammer Curl', 'Rosca Martelo', 'arms', 'Neutral grip curl'),
('Tricep Dips', 'Mergulho', 'arms', 'Bodyweight tricep exercise'),
('Tricep Pushdown', 'Tríceps na Polia', 'arms', 'Cable tricep extension'),
('Skull Crushers', 'Tríceps Testa', 'arms', 'Lying tricep extension'),

-- CORE (Abdômen)
('Plank', 'Prancha', 'core', 'Isometric core hold'),
('Crunches', 'Abdominal', 'core', 'Basic ab crunches'),
('Russian Twist', 'Abdominal Russo', 'core', 'Rotational core exercise'),
('Leg Raises', 'Elevação de Pernas', 'core', 'Lower ab exercise'),
('Mountain Climbers', 'Escalador', 'core', 'Dynamic core exercise'),

-- CARDIO
('Treadmill', 'Esteira', 'cardio', 'Running or walking'),
('Cycling', 'Bicicleta', 'cardio', 'Stationary or outdoor bike'),
('Rowing Machine', 'Remador', 'cardio', 'Cardio rowing'),
('Jump Rope', 'Pular Corda', 'cardio', 'Skipping rope'),
('Burpees', 'Burpees', 'cardio', 'Full body cardio exercise')

ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE workout_exercises IS 'Biblioteca global de exercícios pré-definidos';
COMMENT ON TABLE user_workout_days IS 'Dias de treino semanais configurados pelo usuário';
COMMENT ON TABLE user_workout_exercises IS 'Exercícios atribuídos a cada dia de treino';
COMMENT ON TABLE workout_logs IS 'Histórico de treinos realizados';
COMMENT ON TABLE workout_log_exercises IS 'Detalhes dos exercícios em cada treino realizado';
