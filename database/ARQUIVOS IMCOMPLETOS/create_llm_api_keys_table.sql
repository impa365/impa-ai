-- =====================================================
-- MIGRATION: Sistema de Gerenciamento de API Keys para LLMs
-- Descrição: Permitir que usuários gerenciem múltiplas API keys para diferentes provedores LLM
-- Data: 2025-11-04
-- Segurança: API keys são armazenadas de forma segura
-- =====================================================

BEGIN;

-- 1. Criar tipo ENUM para provedores LLM
DO $$ BEGIN
    CREATE TYPE impaai.llm_provider_enum AS ENUM ('openai', 'anthropic', 'google', 'ollama', 'groq');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de API Keys para LLMs
CREATE TABLE IF NOT EXISTS impaai.llm_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES impaai.user_profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Identificação da chave
    key_name VARCHAR(255) NOT NULL,
    provider impaai.llm_provider_enum NOT NULL,
    
    -- API Key (deve ser criptografada pela aplicação antes de salvar)
    api_key TEXT NOT NULL,
    
    -- Metadados
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Chave padrão para o provedor
    
    -- Estatísticas de uso (opcional)
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_key_name_per_user UNIQUE (user_id, key_name),
    CONSTRAINT key_name_not_empty CHECK (length(trim(key_name)) > 0)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_user_id ON impaai.llm_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_provider ON impaai.llm_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_active ON impaai.llm_api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_llm_api_keys_default ON impaai.llm_api_keys(user_id, provider, is_default) WHERE is_default = true;

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION impaai.update_llm_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para updated_at
DROP TRIGGER IF EXISTS update_llm_api_keys_updated_at ON impaai.llm_api_keys;
CREATE TRIGGER update_llm_api_keys_updated_at
    BEFORE UPDATE ON impaai.llm_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_llm_api_keys_updated_at();

-- 6. Função para garantir apenas uma chave padrão por provedor por usuário
CREATE OR REPLACE FUNCTION impaai.ensure_single_default_llm_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a nova chave está sendo marcada como padrão
    IF NEW.is_default = true THEN
        -- Desmarcar outras chaves padrão do mesmo usuário e provedor
        UPDATE impaai.llm_api_keys
        SET is_default = false
        WHERE user_id = NEW.user_id
          AND provider = NEW.provider
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para garantir chave padrão única
DROP TRIGGER IF EXISTS ensure_single_default_llm_key ON impaai.llm_api_keys;
CREATE TRIGGER ensure_single_default_llm_key
    BEFORE INSERT OR UPDATE ON impaai.llm_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION impaai.ensure_single_default_llm_key();

-- 8. Comentários
COMMENT ON TABLE impaai.llm_api_keys IS 'Gerenciamento de API Keys para provedores LLM por usuário';
COMMENT ON COLUMN impaai.llm_api_keys.key_name IS 'Nome identificador da chave (ex: "OpenAI Produção", "Claude Personal")';
COMMENT ON COLUMN impaai.llm_api_keys.provider IS 'Provedor LLM: openai, anthropic, google, ollama, groq';
COMMENT ON COLUMN impaai.llm_api_keys.api_key IS 'Chave API - DEVE ser criptografada pela aplicação antes de salvar';
COMMENT ON COLUMN impaai.llm_api_keys.is_default IS 'Define se é a chave padrão para o provedor (apenas uma por provedor por usuário)';

-- 9. Políticas de segurança RLS (Row Level Security)
ALTER TABLE impaai.llm_api_keys ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem suas próprias chaves
DROP POLICY IF EXISTS llm_api_keys_user_isolation ON impaai.llm_api_keys;
CREATE POLICY llm_api_keys_user_isolation ON impaai.llm_api_keys
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

COMMIT;

-- =====================================================
-- ROLLBACK (caso necessário):
-- DROP TRIGGER IF EXISTS ensure_single_default_llm_key ON impaai.llm_api_keys;
-- DROP TRIGGER IF EXISTS update_llm_api_keys_updated_at ON impaai.llm_api_keys;
-- DROP FUNCTION IF EXISTS impaai.ensure_single_default_llm_key();
-- DROP FUNCTION IF EXISTS impaai.update_llm_api_keys_updated_at();
-- DROP TABLE IF EXISTS impaai.llm_api_keys CASCADE;
-- DROP TYPE IF EXISTS impaai.llm_provider_enum CASCADE;
-- =====================================================

