-- Adicionar colunas para integrações de vector store
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS chatnode_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chatnode_api_key TEXT,
ADD COLUMN IF NOT EXISTS chatnode_bot_id TEXT,
ADD COLUMN IF NOT EXISTS orimon_integration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS orimon_api_key TEXT,
ADD COLUMN IF NOT EXISTS orimon_bot_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';
COMMENT ON COLUMN ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';
COMMENT ON COLUMN ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';
COMMENT ON COLUMN ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';
COMMENT ON COLUMN ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';
COMMENT ON COLUMN ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';
