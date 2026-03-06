-- =====================================================
-- MIGRATION: Suporte a gatilhos de mensagem WhatsApp (Uazapi)
-- Descrição: Adiciona coluna de payload específico e permite action_type whatsapp_message
-- Data: 2025-11-11
-- =====================================================

BEGIN;

-- Tornar webhook_url opcional (apenas obrigatório para action_type = 'webhook')
ALTER TABLE impaai.reminder_triggers
  ALTER COLUMN webhook_url DROP NOT NULL;

-- Garantir coluna para armazenar configurações específicas de cada ação
ALTER TABLE impaai.reminder_triggers
  ADD COLUMN IF NOT EXISTS action_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Atualizar constraint do action_type para aceitar whatsapp_message
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reminder_triggers_action_type_check'
      AND conrelid = 'impaai.reminder_triggers'::regclass
  ) THEN
    ALTER TABLE impaai.reminder_triggers
      DROP CONSTRAINT reminder_triggers_action_type_check;
  END IF;
END $$;

ALTER TABLE impaai.reminder_triggers
  ADD CONSTRAINT reminder_triggers_action_type_check
  CHECK (action_type IN ('webhook', 'whatsapp_message'));

-- Garantir consistência: quando action_type = 'webhook', webhook_url deve estar presente
ALTER TABLE impaai.reminder_triggers
  ADD CONSTRAINT reminder_triggers_webhook_url_check
  CHECK (
    action_type <> 'webhook'
    OR webhook_url IS NOT NULL
  );

-- Normalizar payload nulo
UPDATE impaai.reminder_triggers
SET action_payload = '{}'::jsonb
WHERE action_payload IS NULL;

COMMIT;

-- =====================================================
-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE impaai.reminder_triggers DROP CONSTRAINT IF EXISTS reminder_triggers_webhook_url_check;
-- ALTER TABLE impaai.reminder_triggers DROP CONSTRAINT IF EXISTS reminder_triggers_action_type_check;
-- ALTER TABLE impaai.reminder_triggers
--   ADD CONSTRAINT reminder_triggers_action_type_check
--   CHECK (action_type IN ('webhook'));
-- ALTER TABLE impaai.reminder_triggers
--   ALTER COLUMN webhook_url SET NOT NULL;
-- ALTER TABLE impaai.reminder_triggers
--   DROP COLUMN IF EXISTS action_payload;
-- COMMIT;
-- =====================================================

