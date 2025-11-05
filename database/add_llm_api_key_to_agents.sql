-- =====================================================
-- MIGRATION: Adicionar campo llm_api_key na tabela ai_agents
-- Descrição: Permitir que usuários forneçam sua própria chave API da LLM
-- Data: 2025-11-04
-- =====================================================

BEGIN;

-- Adicionar coluna para API Key da LLM
ALTER TABLE impaai.ai_agents
ADD COLUMN IF NOT EXISTS llm_api_key TEXT;

-- Comentário da coluna
COMMENT ON COLUMN impaai.ai_agents.llm_api_key IS 'Chave API customizada do usuário para o provedor LLM (OpenAI, Anthropic, etc.)';

-- Log de execução
DO $$
BEGIN
  RAISE NOTICE 'Campo llm_api_key adicionado com sucesso à tabela ai_agents';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- ALTER TABLE impaai.ai_agents DROP COLUMN IF EXISTS llm_api_key;
-- =====================================================

