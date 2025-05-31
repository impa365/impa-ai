-- Tabela para configurações de agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  evolution_bot_id VARCHAR(255), -- ID do bot na Evolution API
  
  -- Informações básicas do agente
  name VARCHAR(255) NOT NULL,
  description TEXT, -- Descrição/Identidade do Agente (Ex: Luna - Assistente de Vendas)
  prompt TEXT NOT NULL, -- Treinamento: Prompt da IA
  
  -- Configurações de personalidade e comportamento
  tone VARCHAR(50) NOT NULL DEFAULT 'humanizado', -- humanizado, formal, tecnico, casual, comercial
  main_function VARCHAR(50) NOT NULL DEFAULT 'atendimento', -- atendimento, vendas, agendamento, suporte, qualificacao
  temperature DECIMAL(3,2) DEFAULT 0.7, -- Criatividade (0.0 a 1.0)
  
  -- Recursos habilitados
  transcribe_audio BOOLEAN DEFAULT false,
  understand_images BOOLEAN DEFAULT false,
  voice_response BOOLEAN DEFAULT false,
  voice_provider VARCHAR(50), -- fish_audio, eleven_labs
  voice_api_key TEXT,
  calendar_integration BOOLEAN DEFAULT false,
  calendar_provider VARCHAR(50) DEFAULT 'cal_com',
  calendar_api_key TEXT,
  
  -- Configurações do bot Evolution (serão usadas para criar/atualizar o bot na Evolution API)
  -- A apiUrl do bot Evolution será a URL do N8N do admin + ?agent_id=id_do_agente_no_banco
  evolution_api_url_suffix VARCHAR(255) DEFAULT '?agent_id=', -- Para concatenar com a URL base do N8N
  evolution_api_key TEXT, -- API Key do fluxo N8N (opcional)

  trigger_type VARCHAR(20) DEFAULT 'keyword', -- all, keyword
  trigger_operator VARCHAR(20) DEFAULT 'contains', -- contains, equals, startsWith, endsWith, regex, none
  trigger_value VARCHAR(255),
  keyword_finish VARCHAR(50) DEFAULT '#SAIR',
  unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular sua pergunta?',
  delay_message INTEGER DEFAULT 1000,
  listening_from_me BOOLEAN DEFAULT false,
  stop_bot_from_me BOOLEAN DEFAULT false,
  keep_open BOOLEAN DEFAULT false,
  debounce_time INTEGER DEFAULT 0,
  ignore_groups BOOLEAN DEFAULT true, -- Por padrão, ignora grupos
  split_messages BOOLEAN DEFAULT true,
  time_per_char INTEGER DEFAULT 50,
  expire_time INTEGER DEFAULT 0, -- Tempo em minutos para expirar a conversa, 0 para nunca expirar
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, training, error
  is_default BOOLEAN DEFAULT false, -- Apenas um agente padrão por conexão
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de limites de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_agents INTEGER DEFAULT 3,
  
  -- Permissões de recursos para o usuário
  allow_transcribe_audio BOOLEAN DEFAULT true,
  allow_understand_images BOOLEAN DEFAULT true,
  allow_voice_response BOOLEAN DEFAULT true,
  allow_calendar_integration BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela para configurações globais de agentes e integrações
CREATE TABLE IF NOT EXISTS global_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL, -- Pode armazenar strings, booleans, números ou JSON
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações globais padrão (se não existirem)
INSERT INTO global_agent_settings (setting_key, setting_value, description) VALUES
('default_max_agents_per_user', '3', 'Limite padrão de agentes por usuário'),
('n8n_base_url_for_agents', '""', 'URL base do N8N para os webhooks dos agentes. Ex: https://n8n.example.com/webhook/'),
('n8n_api_key_for_agents', '""', 'API Key global para os fluxos N8N dos agentes (se aplicável)'),

('feature_transcribe_audio_enabled', 'true', 'Habilitar globalmente o recurso de transcrição de áudio'),
('feature_understand_images_enabled', 'true', 'Habilitar globalmente o recurso de entendimento de imagens'),
('feature_voice_response_enabled', 'true', 'Habilitar globalmente o recurso de resposta por voz'),
('feature_calendar_integration_enabled', 'true', 'Habilitar globalmente o recurso de integração de agenda'),

('voice_provider_fish_audio_enabled', 'true', 'Permitir uso do Fish Audio como provedor de voz'),
('voice_provider_eleven_labs_enabled', 'true', 'Permitir uso do Eleven Labs como provedor de voz'),
('calendar_provider_cal_com_enabled', 'true', 'Permitir uso do Cal.com como provedor de agenda')
ON CONFLICT (setting_key) DO NOTHING;


-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON ai_agents(is_default);

-- Constraint para garantir apenas um agente padrão por conexão
-- Removendo a constraint antiga se existir
DROP INDEX IF EXISTS idx_ai_agents_default_per_connection;
-- Adicionando a nova constraint (Supabase pode ter problemas com WHERE em unique index via dashboard, mas SQL direto funciona)
-- Esta constraint garante que para cada whatsapp_connection_id, só pode haver uma linha com is_default = true.
-- Linhas com is_default = false ou is_default = NULL não são afetadas e podem ser múltiplas.
CREATE UNIQUE INDEX idx_unique_default_agent_per_connection ON ai_agents (whatsapp_connection_id) WHERE is_default = TRUE;


-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_agents_updated_at') THEN
    CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_agent_settings_updated_at') THEN
    CREATE TRIGGER update_user_agent_settings_updated_at BEFORE UPDATE ON user_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_global_agent_settings_updated_at') THEN
    CREATE TRIGGER update_global_agent_settings_updated_at BEFORE UPDATE ON global_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Adicionar coluna organization_id na tabela ai_agents se não existir, referenciando user_profiles(id)
-- Esta coluna será usada para filtrar agentes por organização/usuário no painel de admin
-- A coluna user_id já existe e é usada para o proprietário do agente.
-- A coluna organization_id em user_profiles indica a qual organização o usuário pertence.
-- Se um agente é criado por um usuário, o organization_id do agente deve ser o mesmo do usuário.
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Atualizar organization_id para agentes existentes baseado no user_id
UPDATE ai_agents ag
SET organization_id = up.organization_id
FROM user_profiles up
WHERE ag.user_id = up.id AND ag.organization_id IS NULL;

-- Adicionar referência correta para user_profiles na tabela ai_agents
-- A coluna user_profiles!ai_agents_organization_id_fkey(email) na query da página de admin está incorreta.
-- Deve ser user_profiles!inner(id, email) ou similar, ou juntar explicitamente.
-- A coluna organization_id em ai_agents deve referenciar user_profiles.id (que é o ID da organização/usuário principal)
-- No entanto, a query original `user_profiles!ai_agents_organization_id_fkey(email)` sugere que `organization_id` em `ai_agents`
-- deveria ser uma FK para `user_profiles.id` e você quer buscar o email desse perfil.
-- A coluna `organization_id` em `user_profiles` já existe.
-- Se a intenção é que `ai_agents.organization_id` referencie a organização do criador do agente:
-- A coluna `user_id` em `ai_agents` já aponta para o criador.
-- A `organization_id` do criador está em `user_profiles.organization_id`.
-- A query na página de admin `app/admin/agents/page.tsx` precisa ser ajustada para buscar o email do `user_id` do agente.
-- A FK `ai_agents_organization_id_fkey` não existe por padrão.
-- A query `supabase.from("ai_agents").select("*, user_profiles!ai_agents_user_id_fkey(email)")` seria mais correta se `ai_agents_user_id_fkey` fosse o nome da FK.
-- Ou simplesmente `supabase.from("ai_agents").select("*, user_profiles(email)").eq('user_profiles.id', 'ai_agents.user_id')`
-- A coluna `organization_id` em `ai_agents` pode ser redundante se sempre for a mesma do `user_profiles.organization_id` do `ai_agents.user_id`.
-- Vamos manter `ai_agents.user_id` como a referência ao criador.
-- A query na página de admin será ajustada posteriormente.

-- Adicionar coluna para tipo de IA (ex: gpt-3.5-turbo, gpt-4, etc.)
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo';

-- Adicionar coluna para armazenar o ID da instância da Evolution API associada
ALTER TABLE ai_agents
ADD COLUMN IF NOT EXISTS evolution_instance_name VARCHAR(255);

-- Garantir que a coluna whatsapp_connection_id em ai_agents não seja nula
ALTER TABLE ai_agents ALTER COLUMN whatsapp_connection_id SET NOT NULL;
