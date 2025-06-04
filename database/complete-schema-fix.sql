-- ============================================
-- SCRIPT COMPLETO PARA CORRIGIR BANCO DE DADOS
-- Execute este script no seu outro servidor
-- ============================================

-- 1. Criar tabela user_api_keys (se não existir)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna api_key na user_profiles (se não existir)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN api_key VARCHAR(255) UNIQUE;
  END IF;
END $$;

-- 3. Garantir que todas as colunas de vector store existem
DO $$ 
BEGIN 
  -- ChatNode.ai
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'chatnode_integration'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN chatnode_integration BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'chatnode_api_key'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN chatnode_api_key TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'chatnode_bot_id'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN chatnode_bot_id TEXT;
  END IF;
  
  -- Orimon.ai
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'orimon_integration'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN orimon_integration BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'orimon_api_key'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN orimon_api_key TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_agents' AND column_name = 'orimon_bot_id'
  ) THEN
    ALTER TABLE ai_agents ADD COLUMN orimon_bot_id TEXT;
  END IF;
END $$;

-- 4. Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_ai_agents_chatnode ON ai_agents(chatnode_integration) WHERE chatnode_integration = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_orimon ON ai_agents(orimon_integration) WHERE orimon_integration = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_api_key ON user_profiles(api_key) WHERE api_key IS NOT NULL;

-- 5. Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para updated_at na user_api_keys (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_api_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 7. Adicionar comentários para documentação
COMMENT ON TABLE user_api_keys IS 'Chaves de API dos usuários para acesso externo';
COMMENT ON COLUMN user_api_keys.api_key IS 'Chave única para autenticação via API';
COMMENT ON COLUMN user_api_keys.description IS 'Descrição da finalidade da API key';
COMMENT ON COLUMN user_api_keys.last_used_at IS 'Última vez que a API key foi utilizada';

COMMENT ON COLUMN ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';
COMMENT ON COLUMN ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';
COMMENT ON COLUMN ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';
COMMENT ON COLUMN ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';
COMMENT ON COLUMN ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';
COMMENT ON COLUMN ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';

-- 8. Inserir configurações padrão do sistema (se não existirem)
INSERT INTO system_settings (setting_key, setting_value) VALUES 
('allow_public_registration', 'false'),
('max_agents_per_user', '5'),
('enable_vector_stores', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- 9. Verificar integridade dos dados
UPDATE ai_agents SET status = 'inactive' 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- 10. Verificação final - mostrar estatísticas
SELECT 
  'user_profiles' as tabela, COUNT(*) as registros FROM user_profiles
UNION ALL
SELECT 
  'whatsapp_connections' as tabela, COUNT(*) as registros FROM whatsapp_connections
UNION ALL
SELECT 
  'ai_agents' as tabela, COUNT(*) as registros FROM ai_agents
UNION ALL
SELECT 
  'user_api_keys' as tabela, COUNT(*) as registros FROM user_api_keys;
