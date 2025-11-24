
-- =====================================================
-- TABELA DE METAS DIÁRIAS (HISTÓRICO)
-- =====================================================
-- Armazena as metas de consumo de água do usuário
-- Permite histórico: quando o usuário muda a meta, 
-- uma nova linha é inserida com effective_from = data da mudança
-- Para pegar a meta vigente em um dia: buscar a mais recente com effective_from <= dia
CREATE TABLE drinkwater_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Meta em mililitros (entre 500ml e 6000ml - limites razoáveis)
  goal_quantity_ml INTEGER NOT NULL CHECK (goal_quantity_ml BETWEEN 500 AND 6000),
  -- Data a partir da qual esta meta passa a valer
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Garante que um usuário não pode ter duas metas na mesma data
  UNIQUE(user_id, effective_from)
);

-- =====================================================
-- TABELA DE REGISTROS DE INGESTÃO (LOGS)
-- =====================================================
-- Cada linha representa uma vez que o usuário bebeu água
-- Usado para somar o total do dia e calcular progresso
CREATE TABLE drinkwater_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Quantidade em mililitros (limite 2000ml por registro individual)
  quantity_ml INTEGER NOT NULL CHECK (quantity_ml BETWEEN 1 AND 2000),
  -- Momento em que bebeu (com hora exata)
  when_drink TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Origem: 'preset' (botão rápido) ou 'custom' (valor digitado)
  source TEXT NOT NULL CHECK (source IN ('preset', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABELA DE RESUMO DIÁRIO (CACHE/AGREGAÇÃO)
-- =====================================================
-- Uma linha por dia por usuário com totais agregados
-- Serve como cache para não recalcular soma de logs toda hora
-- Quando inserir: pegar goal_ml da meta vigente (effective_from <= dia)
CREATE TABLE drinkwater_summary (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Dia do resumo (sem hora, só data)
  drinkwater_day DATE NOT NULL,
  -- Total consumido neste dia (soma dos logs)
  total_ml INTEGER NOT NULL DEFAULT 0,
  -- Meta que valia neste dia (cópia congelada)
  goal_ml INTEGER NOT NULL,
  -- Calculado automaticamente: true se total >= meta
  completed BOOLEAN GENERATED ALWAYS AS (total_ml >= goal_ml) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Chave primária composta: um resumo por usuário por dia
  PRIMARY KEY (user_id, drinkwater_day)
);

-- =====================================================
-- TABELA DE STREAK (DIAS CONSECUTIVOS)
-- =====================================================
-- Uma linha por usuário guardando sequência atual e recorde
-- Atualizar quando total_ml >= goal_ml pela primeira vez no dia
CREATE TABLE drinkwater_streak (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Dias consecutivos batendo a meta (atual)
  streak_current INTEGER NOT NULL DEFAULT 0,
  -- Maior sequência já alcançada (recorde pessoal)
  streak_best INTEGER NOT NULL DEFAULT 0,
  -- Última data em que a streak foi verificada/atualizada
  last_day_check DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Acelera busca de logs por usuário ordenados por data
CREATE INDEX idx_drinkwater_logs_user_date ON drinkwater_logs (user_id, when_drink DESC);

-- Acelera busca de meta vigente (mais recente <= data)
CREATE INDEX idx_drinkwater_goals_user_date ON drinkwater_goals (user_id, effective_from DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA
-- =====================================================
-- Garante que cada usuário só vê/edita seus próprios dados

-- Ativar RLS em todas as tabelas
ALTER TABLE drinkwater_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinkwater_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinkwater_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinkwater_streak ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa linhas onde user_id = seu próprio ID
CREATE POLICY "Users can manage their own goals" ON drinkwater_goals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own logs" ON drinkwater_logs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own summary" ON drinkwater_summary
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own streak" ON drinkwater_streak
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================
-- Função que atualiza o campo updated_at em todo UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas que têm updated_at
CREATE TRIGGER update_drinkwater_summary_updated_at
  BEFORE UPDATE ON drinkwater_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drinkwater_streak_updated_at
  BEFORE UPDATE ON drinkwater_streak
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
