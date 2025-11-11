-- =====================================================
-- MIGRATION: Criar tabela de logs dos gatilhos de lembretes
-- Descrição: Registra envios de lembretes para evitar duplicidade e auditar resultados
-- Data: 2025-11-07
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS impaai.reminder_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES impaai.reminder_triggers(id) ON DELETE CASCADE,
  booking_uid TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_status INTEGER,
  webhook_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS reminder_trigger_logs_unique_idx
  ON impaai.reminder_trigger_logs(trigger_id, booking_uid);

CREATE INDEX IF NOT EXISTS reminder_trigger_logs_trigger_idx
  ON impaai.reminder_trigger_logs(trigger_id);

GRANT SELECT, INSERT, UPDATE ON impaai.reminder_trigger_logs TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Tabela impaai.reminder_trigger_logs criada/atualizada com sucesso.';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- DROP TABLE IF EXISTS impaai.reminder_trigger_logs;
-- =====================================================


