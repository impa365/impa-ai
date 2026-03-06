-- =====================================================
-- MIGRATION: Criar tabela de histórico das execuções do cron de lembretes
-- Data: 2025-11-07
-- =====================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS impaai.reminder_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT FALSE,
  reminders_due INTEGER NOT NULL DEFAULT 0,
  reminders_sent INTEGER NOT NULL DEFAULT 0,
  reminders_failed INTEGER NOT NULL DEFAULT 0,
  triggers_processed INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS reminder_cron_runs_started_idx
  ON impaai.reminder_cron_runs(started_at DESC);

GRANT SELECT, INSERT, UPDATE ON impaai.reminder_cron_runs TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Tabela impaai.reminder_cron_runs criada/atualizada com sucesso.';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- DROP TABLE IF EXISTS impaai.reminder_cron_runs;
-- =====================================================

