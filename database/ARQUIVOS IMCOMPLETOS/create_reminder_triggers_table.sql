-- =====================================================
-- MIGRATION: Criar estrutura base para gatilhos de lembretes Cal.com
-- Descrição: Tabela para armazenar regras de disparo (antes do evento) e ações (webhook)
-- Data: 2025-11-07
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS impaai.reminder_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES impaai.ai_agents(id) ON DELETE CASCADE,
  timing_type TEXT NOT NULL DEFAULT 'before_event_start',
  offset_amount INTEGER NOT NULL CHECK (offset_amount >= 0),
  offset_unit TEXT NOT NULL CHECK (offset_unit IN ('minutes', 'hours', 'days')),
  scope_type TEXT NOT NULL DEFAULT 'agent' CHECK (scope_type IN ('agent', 'calendar', 'event_type')),
  scope_reference TEXT,
  action_type TEXT NOT NULL DEFAULT 'webhook' CHECK (action_type IN ('webhook')),
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS reminder_triggers_agent_idx ON impaai.reminder_triggers(agent_id);
CREATE INDEX IF NOT EXISTS reminder_triggers_active_idx ON impaai.reminder_triggers(is_active);

-- Trigger para atualizar coluna updated_at
DROP TRIGGER IF EXISTS update_reminder_triggers_updated_at ON impaai.reminder_triggers;
DROP FUNCTION IF EXISTS impaai.set_reminder_triggers_updated_at();

CREATE FUNCTION impaai.set_reminder_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reminder_triggers_updated_at
BEFORE UPDATE ON impaai.reminder_triggers
FOR EACH ROW
EXECUTE PROCEDURE impaai.set_reminder_triggers_updated_at();

DO $$
BEGIN
  RAISE NOTICE 'Tabela impaai.reminder_triggers criada/atualizada com sucesso.';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- DROP TABLE IF EXISTS impaai.reminder_triggers;
-- DROP FUNCTION IF EXISTS impaai.set_reminder_triggers_updated_at();
-- =====================================================

