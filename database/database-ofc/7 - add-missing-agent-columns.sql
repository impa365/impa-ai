-- Script para adicionar colunas que faltam na tabela ai_agents
-- Execute este script no Supabase para adicionar as funcionalidades completas

-- Adicionar colunas básicas que faltam
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS model_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prompt_template TEXT;

-- Adicionar colunas para integrações de vector store
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS chatnode_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS chatnode_api_key TEXT,
ADD COLUMN IF NOT EXISTS chatnode_bot_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS orimon_integration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orimon_api_key TEXT,
ADD COLUMN IF NOT EXISTS orimon_bot_id VARCHAR(255);

-- Adicionar colunas para configurações avançadas da Evolution API
ALTER TABLE impaai.ai_agents 
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(20) DEFAULT 'keyword',
ADD COLUMN IF NOT EXISTS trigger_operator VARCHAR(20) DEFAULT 'equals',
ADD COLUMN IF NOT EXISTS trigger_value VARCHAR(255),
ADD COLUMN IF NOT EXISTS keyword_finish VARCHAR(100) DEFAULT '#sair',
ADD COLUMN IF NOT EXISTS debounce_time INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS listening_from_me BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_bot_from_me BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS keep_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS split_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS time_per_char INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS delay_message INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS unknown_message TEXT DEFAULT 'Desculpe, não entendi. Digite a palavra-chave para começar.';

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON impaai.ai_agents(type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_trigger_type ON impaai.ai_agents(trigger_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_chatnode_integration ON impaai.ai_agents(chatnode_integration);
CREATE INDEX IF NOT EXISTS idx_ai_agents_orimon_integration ON impaai.ai_agents(orimon_integration);

-- Atualizar agentes existentes com valores padrão para model_config se estiver vazio
UPDATE impaai.ai_agents 
SET model_config = '{
  "activation_keyword": "",
  "model": "gpt-3.5-turbo",
  "voice_id": "",
  "calendar_event_id": "",
  "keyword_finish": "#sair",
  "delay_message": 1000,
  "unknown_message": "Desculpe, não entendi. Digite a palavra-chave para começar.",
  "listening_from_me": false,
  "stop_bot_from_me": true,
  "keep_open": false,
  "debounce_time": 10,
  "split_messages": true,
  "time_per_char": 100
}'::jsonb
WHERE model_config IS NULL OR model_config = '{}'::jsonb;

-- Migrar dados das novas colunas para model_config se necessário
UPDATE impaai.ai_agents 
SET model_config = model_config || jsonb_build_object(
  'activation_keyword', COALESCE(trigger_value, ''),
  'keyword_finish', COALESCE(keyword_finish, '#sair'),
  'delay_message', COALESCE(delay_message, 1000),
  'unknown_message', COALESCE(unknown_message, 'Desculpe, não entendi. Digite a palavra-chave para começar.'),
  'listening_from_me', COALESCE(listening_from_me, false),
  'stop_bot_from_me', COALESCE(stop_bot_from_me, true),
  'keep_open', COALESCE(keep_open, false),
  'debounce_time', COALESCE(debounce_time, 10),
  'split_messages', COALESCE(split_messages, true),
  'time_per_char', COALESCE(time_per_char, 100)
)
WHERE model_config IS NOT NULL;

-- Comentário informativo
COMMENT ON COLUMN impaai.ai_agents.model_config IS 'Configurações do modelo de IA e Evolution API em formato JSON';
COMMENT ON COLUMN impaai.ai_agents.chatnode_integration IS 'Integração ativada com ChatNode.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.orimon_integration IS 'Integração ativada com Orimon.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.trigger_type IS 'Tipo de ativação: keyword, all, etc.';
COMMENT ON COLUMN impaai.ai_agents.trigger_operator IS 'Operador para trigger: equals, contains, startsWith, etc.';
