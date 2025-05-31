-- Remover tabelas antigas se existirem para garantir um estado limpo (cuidado em produção!)
DROP TABLE IF EXISTS global_agent_settings CASCADE;
DROP TABLE IF EXISTS user_agent_settings CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;

-- Tabela para configurações globais de agentes e integrações
CREATE TABLE IF NOT EXISTS global_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL, -- Pode armazenar strings, booleans, números ou JSON
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de limites e permissões de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_agents INTEGER, -- Se NULL, usa o padrão global
  
  -- Permissões de recursos para o usuário (se NULL, usa o padrão global)
  allow_transcribe_audio BOOLEAN,
  allow_understand_images BOOLEAN,
  allow_voice_response BOOLEAN,
  allow_calendar_integration BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela principal para configurações de agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- Proprietário do agente
  organization_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- Organização do proprietário (para facilitar filtros de admin)
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  evolution_bot_id VARCHAR(255), -- ID do bot retornado pela Evolution API
  evolution_instance_name VARCHAR(255) NOT NULL, -- Nome da instância na Evolution API (para construir a URL da API)
  
  -- Informações básicas do agente
  name VARCHAR(255) NOT NULL,
  description TEXT, -- Descrição/Identidade do Agente (Ex: Luna - Assistente de Vendas)
  prompt TEXT NOT NULL, -- Treinamento: Prompt da IA
  ai_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo', -- Modelo de IA a ser usado
  
  -- Configurações de personalidade e comportamento
  tone VARCHAR(50) NOT NULL DEFAULT 'humanizado', -- humanizado, formal, tecnico, casual, comercial
  main_function VARCHAR(50) NOT NULL DEFAULT 'atendimento', -- atendimento, vendas, agendamento, suporte, qualificacao
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0.0 AND temperature <= 1.0), -- Criatividade
  
  -- Recursos habilitados (controlados por permissões globais/usuário)
  transcribe_audio BOOLEAN DEFAULT false,
  understand_images BOOLEAN DEFAULT false,
  
  voice_response BOOLEAN DEFAULT false,
  voice_provider VARCHAR(50), -- fish_audio, eleven_labs
  voice_api_key TEXT, -- API Key específica para o provedor de voz deste agente
  
  calendar_integration BOOLEAN DEFAULT false,
  calendar_provider VARCHAR(50) DEFAULT 'cal_com',
  calendar_api_key TEXT, -- API Key específica para o provedor de calendário deste agente
  
  -- Configurações do bot Evolution
  -- A apiUrl do bot Evolution será a URL base do N8N (de global_agent_settings) + sufixo + id do agente
  n8n_webhook_url TEXT, -- URL completa do webhook N8N para este agente
  n8n_api_key TEXT, -- API Key específica para o webhook N8N deste agente (opcional)

  trigger_type VARCHAR(20) DEFAULT 'keyword', 
  trigger_operator VARCHAR(20) DEFAULT 'contains',
  trigger_value VARCHAR(255),
  keyword_finish VARCHAR(50) DEFAULT '#SAIR',
  unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular sua pergunta?',
  delay_message INTEGER DEFAULT 1000, -- Em milissegundos
  listening_from_me BOOLEAN DEFAULT false,
  stop_bot_from_me BOOLEAN DEFAULT false,
  keep_open BOOLEAN DEFAULT false, -- Manter a conversa aberta após o bot responder
  debounce_time INTEGER DEFAULT 0, -- Tempo em segundos para agrupar mensagens antes de enviar ao bot
  ignore_groups BOOLEAN DEFAULT true, -- Se true, ignora mensagens de grupos
  split_messages BOOLEAN DEFAULT true, -- Dividir mensagens longas
  time_per_char INTEGER DEFAULT 50, -- Tempo por caractere para simular digitação
  expire_time INTEGER DEFAULT 0, -- Tempo em minutos para expirar a conversa (0 para nunca)
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, training, error
  is_default BOOLEAN DEFAULT false, -- Apenas um agente padrão por conexão WhatsApp
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações globais padrão (se não existirem)
INSERT INTO global_agent_settings (setting_key, setting_value, description) VALUES
('default_max_agents_per_user', '3', 'Limite padrão de agentes que um usuário pode criar.'),
('n8n_base_url_for_agents', '""', 'URL base do N8N para os webhooks dos agentes. Ex: https://n8n.example.com/webhook/ (deve terminar com /)'),
('n8n_global_api_key_for_agents', '""', 'API Key global para os fluxos N8N dos agentes (se os fluxos exigirem e não houver uma específica no agente).'),

('feature_transcribe_audio_globally_enabled', 'true', 'Habilitar globalmente o recurso de transcrição de áudio para agentes.'),
('feature_understand_images_globally_enabled', 'true', 'Habilitar globalmente o recurso de entendimento de imagens para agentes.'),
('feature_voice_response_globally_enabled', 'true', 'Habilitar globalmente o recurso de resposta por voz para agentes.'),
('feature_calendar_integration_globally_enabled', 'true', 'Habilitar globalmente o recurso de integração de agenda para agentes.'),

('voice_provider_fish_audio_globally_enabled', 'true', 'Permitir globalmente o uso do Fish Audio como provedor de voz.'),
('voice_provider_eleven_labs_globally_enabled', 'true', 'Permitir globalmente o uso do Eleven Labs como provedor de voz.'),
('calendar_provider_cal_com_globally_enabled', 'true', 'Permitir globalmente o uso do Cal.com como provedor de agenda.')
ON CONFLICT (setting_key) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON ai_agents(is_default);
CREATE INDEX IF NOT EXISTS idx_user_agent_settings_user_id ON user_agent_settings(user_id);

-- Constraint para garantir apenas um agente padrão por conexão WhatsApp
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_default_agent_per_connection 
ON ai_agents (whatsapp_connection_id) 
WHERE is_default = TRUE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_agents_updated_at' AND tgrelid = 'ai_agents'::regclass) THEN
    CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_agent_settings_updated_at' AND tgrelid = 'user_agent_settings'::regclass) THEN
    CREATE TRIGGER update_user_agent_settings_updated_at BEFORE UPDATE ON user_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_global_agent_settings_updated_at' AND tgrelid = 'global_agent_settings'::regclass) THEN
    CREATE TRIGGER update_global_agent_settings_updated_at BEFORE UPDATE ON global_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Atualizar organization_id para agentes existentes baseado no user_id do agente
-- Isso é útil se a coluna organization_id foi adicionada depois e precisa ser populada.
UPDATE ai_agents ag
SET organization_id = up.organization_id
FROM user_profiles up
WHERE ag.user_id = up.id AND ag.organization_id IS NULL;

-- Função para obter uma configuração global com fallback
CREATE OR REPLACE FUNCTION get_global_setting(p_setting_key VARCHAR, p_default_value JSONB)
RETURNS JSONB AS $$
DECLARE
  v_setting_value JSONB;
BEGIN
  SELECT setting_value INTO v_setting_value FROM global_agent_settings WHERE setting_key = p_setting_key;
  IF v_setting_value IS NULL THEN
    RETURN p_default_value;
  END IF;
  RETURN v_setting_value;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se um usuário pode usar um recurso específico
CREATE OR REPLACE FUNCTION can_user_use_feature(p_user_id UUID, p_feature_key VARCHAR, p_global_feature_key VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_permission BOOLEAN;
  v_global_permission BOOLEAN;
BEGIN
  -- Verificar permissão específica do usuário
  EXECUTE format('SELECT allow_%s FROM user_agent_settings WHERE user_id = %L', p_feature_key, p_user_id) INTO v_user_permission;
  
  IF v_user_permission IS NOT NULL THEN
    RETURN v_user_permission; -- Retorna a permissão específica do usuário se definida
  END IF;
  
  -- Se não houver permissão específica, verificar permissão global
  SELECT (get_global_setting(p_global_feature_key, 'false')::BOOLEAN) INTO v_global_permission;
  RETURN v_global_permission;
END;
$$ LANGUAGE plpgsql;
