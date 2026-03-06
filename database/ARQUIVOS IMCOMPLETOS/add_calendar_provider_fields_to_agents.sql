-- =====================================================
-- MIGRATION: Adicionar campos de configuração de calendário na tabela ai_agents
-- Descrição: Permite selecionar provedor, versão e URL da API de calendário
-- Data: 2025-11-06
-- =====================================================

BEGIN;

-- Adicionar coluna para identificar o provedor de calendário
ALTER TABLE impaai.ai_agents
ADD COLUMN IF NOT EXISTS calendar_provider TEXT DEFAULT 'calcom';
COMMENT ON COLUMN impaai.ai_agents.calendar_provider IS 'Provedor de calendário utilizado pelo agente (ex: calcom, coming_soon)';

-- Adicionar coluna para armazenar a versão da API do provedor
ALTER TABLE impaai.ai_agents
ADD COLUMN IF NOT EXISTS calendar_api_version TEXT DEFAULT 'v1';
COMMENT ON COLUMN impaai.ai_agents.calendar_api_version IS 'Versão da API do provedor de calendário (ex: v1, v2)';

-- Adicionar coluna para a URL base da API do calendário
ALTER TABLE impaai.ai_agents
ADD COLUMN IF NOT EXISTS calendar_api_url TEXT DEFAULT 'https://api.cal.com/v1';
COMMENT ON COLUMN impaai.ai_agents.calendar_api_url IS 'URL base da API do calendário selecionado';

-- Atualizar registros existentes com valores padrão quando houver integração ativa
UPDATE impaai.ai_agents
SET
  calendar_provider = COALESCE(calendar_provider, 'calcom'),
  calendar_api_version = COALESCE(calendar_api_version, 'v1'),
  calendar_api_url = COALESCE(calendar_api_url, 'https://api.cal.com/v1')
WHERE calendar_integration IS TRUE;

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Campos de configuração de calendário adicionados/atualizados com sucesso na tabela ai_agents';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- ALTER TABLE impaai.ai_agents DROP COLUMN IF EXISTS calendar_provider;
-- ALTER TABLE impaai.ai_agents DROP COLUMN IF EXISTS calendar_api_version;
-- ALTER TABLE impaai.ai_agents DROP COLUMN IF EXISTS calendar_api_url;
-- =====================================================


