-- ============================================
-- ETAPA 2: ADIÇÃO DE COLUNAS PARA EVOLUTION API
-- Execute após a Etapa 1
-- ============================================

SET search_path TO impaai, public;

-- Adicionar colunas específicas para Evolution API na tabela ai_agents
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50) DEFAULT 'all',
ADD COLUMN IF NOT EXISTS trigger_operator VARCHAR(50) DEFAULT 'equals',
ADD COLUMN IF NOT EXISTS trigger_value VARCHAR(255),
ADD COLUMN IF NOT EXISTS keyword_finish VARCHAR(255) DEFAULT '#sair',
ADD COLUMN IF NOT EXISTS debounce_time INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS listening_from_me BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_bot_from_me BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS keep_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS split_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unknown_message TEXT DEFAULT 'Desculpe, não entendi. Digite a palavra-chave para começar.',
ADD COLUMN IF NOT EXISTS delay_message INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS expire_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ignore_jids TEXT[] DEFAULT '{}';

-- Adicionar colunas para integrações de vector store
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS chatnode_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chatnode_api_key TEXT,
ADD COLUMN IF NOT EXISTS chatnode_bot_id TEXT,
ADD COLUMN IF NOT EXISTS orimon_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orimon_api_key TEXT,
ADD COLUMN IF NOT EXISTS orimon_bot_id TEXT;

-- Criar índices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_ai_agents_trigger_type ON impaai.ai_agents(trigger_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_chatnode ON impaai.ai_agents(chatnode_integration) WHERE chatnode_integration = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_orimon ON impaai.ai_agents(orimon_integration) WHERE orimon_integration = true;
CREATE INDEX IF NOT EXISTS idx_ai_agents_voice_enabled ON impaai.ai_agents(voice_response_enabled) WHERE voice_response_enabled = true;

-- Comentários para documentação
COMMENT ON COLUMN impaai.ai_agents.trigger_type IS 'Tipo de ativação: keyword ou all';
COMMENT ON COLUMN impaai.ai_agents.trigger_operator IS 'Operador para comparação: equals, contains, startsWith, endsWith, regex';
COMMENT ON COLUMN impaai.ai_agents.trigger_value IS 'Palavra-chave ou valor para ativação';
COMMENT ON COLUMN impaai.ai_agents.keyword_finish IS 'Palavra-chave para finalizar conversa';
COMMENT ON COLUMN impaai.ai_agents.debounce_time IS 'Tempo de debounce em segundos';
COMMENT ON COLUMN impaai.ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';
COMMENT ON COLUMN impaai.ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';
COMMENT ON COLUMN impaai.ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';
COMMENT ON COLUMN impaai.ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';

SELECT 'ETAPA 2 CONCLUÍDA: Colunas Evolution API adicionadas' as status;
