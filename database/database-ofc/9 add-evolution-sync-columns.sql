SET search_path TO impaai;

-- Adicionar colunas necessárias para sincronização com Evolution API
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(20) DEFAULT 'keyword',
ADD COLUMN IF NOT EXISTS trigger_operator VARCHAR(20) DEFAULT 'equals',
ADD COLUMN IF NOT EXISTS trigger_value TEXT,
ADD COLUMN IF NOT EXISTS keyword_finish VARCHAR(50) DEFAULT '#sair',
ADD COLUMN IF NOT EXISTS debounce_time INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS listening_from_me BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_bot_from_me BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS keep_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS split_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS unknown_message TEXT DEFAULT 'Desculpe, não entendi sua mensagem.',
ADD COLUMN IF NOT EXISTS delay_message INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS expire_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ignore_jids TEXT[] DEFAULT '{}';

-- Adicionar constraints para trigger_type
ALTER TABLE ai_agents 
ADD CONSTRAINT check_trigger_type 
CHECK (trigger_type IN ('keyword', 'all'));

-- Adicionar constraints para trigger_operator
ALTER TABLE ai_agents 
ADD CONSTRAINT check_trigger_operator 
CHECK (trigger_operator IN ('equals', 'contains', 'startsWith', 'endsWith', 'regex'));

-- Comentários para documentação
COMMENT ON COLUMN ai_agents.trigger_type IS 'Tipo de ativação: keyword (palavra-chave) ou all (todas as mensagens)';
COMMENT ON COLUMN ai_agents.trigger_operator IS 'Operador para comparação da palavra-chave';
COMMENT ON COLUMN ai_agents.trigger_value IS 'Valor da palavra-chave para ativação';
COMMENT ON COLUMN ai_agents.keyword_finish IS 'Palavra-chave para finalizar conversa';
COMMENT ON COLUMN ai_agents.debounce_time IS 'Tempo de espera em segundos antes de processar mensagem';
COMMENT ON COLUMN ai_agents.listening_from_me IS 'Se deve escutar mensagens enviadas pelo próprio usuário';
COMMENT ON COLUMN ai_agents.stop_bot_from_me IS 'Se mensagens do usuário param o bot';
COMMENT ON COLUMN ai_agents.keep_open IS 'Se deve manter a conversa sempre aberta';
COMMENT ON COLUMN ai_agents.split_messages IS 'Se deve dividir mensagens longas';
COMMENT ON COLUMN ai_agents.unknown_message IS 'Mensagem padrão para quando não entender';
COMMENT ON COLUMN ai_agents.delay_message IS 'Delay entre mensagens em milissegundos';
COMMENT ON COLUMN ai_agents.expire_time IS 'Tempo de expiração da conversa em minutos (0 = sem expiração)';
COMMENT ON COLUMN ai_agents.ignore_jids IS 'Lista de JIDs para ignorar (grupos, etc)';

-- Atualizar registros existentes com valores padrão
UPDATE ai_agents 
SET 
  trigger_type = CASE WHEN is_default = true THEN 'all' ELSE 'keyword' END,
  trigger_operator = 'equals',
  trigger_value = COALESCE(trigger_value, ''),
  keyword_finish = COALESCE(keyword_finish, '#sair'),
  debounce_time = COALESCE(debounce_time, 10),
  listening_from_me = COALESCE(listening_from_me, false),
  stop_bot_from_me = COALESCE(stop_bot_from_me, true),
  keep_open = COALESCE(keep_open, false),
  split_messages = COALESCE(split_messages, true),
  unknown_message = COALESCE(unknown_message, 'Desculpe, não entendi sua mensagem.'),
  delay_message = COALESCE(delay_message, 1000),
  expire_time = COALESCE(expire_time, 0),
  ignore_jids = COALESCE(ignore_jids, '{}')
WHERE trigger_type IS NULL OR trigger_operator IS NULL;

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agents' 
AND column_name IN (
  'trigger_type', 'trigger_operator', 'trigger_value', 'keyword_finish',
  'debounce_time', 'listening_from_me', 'stop_bot_from_me', 'keep_open',
  'split_messages', 'unknown_message', 'delay_message', 'expire_time', 'ignore_jids'
)
ORDER BY column_name;
