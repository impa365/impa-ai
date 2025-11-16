-- =====================================================
-- MIGRATION: Corrigir timestamps dos lembretes/cron e ajustar defaults
-- Data: 2025-11-10
-- Objetivo:
--   1. Ajustar o default das colunas TIMESTAMPTZ para usar now() diretamente.
--   2. Reinterpretar os valores já gravados (que foram salvos como se estivessem em UTC,
--      mas armazenados como horário local) para o instante correto.
-- =====================================================

BEGIN;

-- 1) Ajustar defaults das tabelas principais
ALTER TABLE impaai.reminder_triggers
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE impaai.reminder_trigger_logs
  ALTER COLUMN executed_at SET DEFAULT now(),
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE impaai.reminder_cron_runs
  ALTER COLUMN started_at SET DEFAULT now(),
  ALTER COLUMN created_at SET DEFAULT now();

-- 2) Corrigir registros existentes interpretando os timestamps como UTC
UPDATE impaai.reminder_triggers
SET
  created_at = (created_at::timestamp) AT TIME ZONE 'UTC',
  updated_at = (updated_at::timestamp) AT TIME ZONE 'UTC';

UPDATE impaai.reminder_trigger_logs
SET
  executed_at = (executed_at::timestamp) AT TIME ZONE 'UTC',
  created_at = (created_at::timestamp) AT TIME ZONE 'UTC';

UPDATE impaai.reminder_cron_runs
SET
  started_at = (started_at::timestamp) AT TIME ZONE 'UTC',
  created_at = (created_at::timestamp) AT TIME ZONE 'UTC',
  finished_at = CASE
    WHEN finished_at IS NOT NULL THEN (finished_at::timestamp) AT TIME ZONE 'UTC'
    ELSE NULL
  END;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
--   ALTER TABLE ... SET DEFAULT timezone('utc', now());
--   UPDATE ... (aplicar compensação inversa, se for o caso).
-- =====================================================


