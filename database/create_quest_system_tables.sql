-- ============================================================================
-- IMPA Quest System - Tabelas do Sistema de Tutorial Gamificado
-- ============================================================================

-- Tabela de progresso do usuário no sistema de quests
CREATE TABLE IF NOT EXISTS impaai.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES impaai.users(id) ON DELETE CASCADE,
  
  -- Progresso geral
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  completed_missions TEXT[] NOT NULL DEFAULT '{}',
  unlocked_badges TEXT[] NOT NULL DEFAULT '{}',
  
  -- Missão ativa
  active_mission_id TEXT,
  mission_progress JSONB,
  
  -- Estatísticas
  stats JSONB NOT NULL DEFAULT '{
    "totalMissionsCompleted": 0,
    "fastestSpeedrun": null,
    "perfectMissions": 0,
    "totalHintsUsed": 0,
    "totalTimeSpent": 0
  }'::jsonb,
  
  -- Preferências
  preferences JSONB NOT NULL DEFAULT '{
    "soundEnabled": true,
    "autoStartMissions": false,
    "showARIA": true,
    "celebrationEffects": true
  }'::jsonb,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_quest_progress UNIQUE (user_id),
  CONSTRAINT valid_level CHECK (current_level >= 1 AND current_level <= 6),
  CONSTRAINT valid_xp CHECK (total_xp >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_id 
  ON impaai.user_quest_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_quest_progress_active_mission 
  ON impaai.user_quest_progress(active_mission_id) 
  WHERE active_mission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_quest_progress_level 
  ON impaai.user_quest_progress(current_level, total_xp);

-- Comentários
COMMENT ON TABLE impaai.user_quest_progress IS 
  'Progresso do usuário no sistema de tutorial gamificado IMPA Quest';

COMMENT ON COLUMN impaai.user_quest_progress.total_xp IS 
  'Total de XP acumulado pelo usuário';

COMMENT ON COLUMN impaai.user_quest_progress.current_level IS 
  'Nível atual: 1=Cadete, 2=Explorador, 3=Oficial, 4=Comandante, 5=Almirante, 6=Lenda IMPA';

COMMENT ON COLUMN impaai.user_quest_progress.completed_missions IS 
  'Array de IDs de missões completadas';

COMMENT ON COLUMN impaai.user_quest_progress.unlocked_badges IS 
  'Array de IDs de badges/conquistas desbloqueadas';

COMMENT ON COLUMN impaai.user_quest_progress.active_mission_id IS 
  'ID da missão atualmente ativa (null se nenhuma)';

COMMENT ON COLUMN impaai.user_quest_progress.mission_progress IS 
  'JSON com progresso detalhado da missão ativa: {missionId, startedAt, currentStepIndex, completedSteps, hintsUsed, timeSpent}';

COMMENT ON COLUMN impaai.user_quest_progress.stats IS 
  'Estatísticas gerais de conquistas e desempenho';

COMMENT ON COLUMN impaai.user_quest_progress.preferences IS 
  'Preferências de UX do sistema de quests (som, auto-start, ARIA, efeitos)';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION impaai.update_quest_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quest_progress_timestamp
  BEFORE UPDATE ON impaai.user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION impaai.update_quest_progress_timestamp();

-- Sucesso!
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabelas do IMPA Quest System criadas com sucesso!';
END $$;

