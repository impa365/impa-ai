-- Tabela para configurações globais de agentes e integrações
CREATE TABLE IF NOT EXISTS global_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações de limites e permissões de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_agents INTEGER DEFAULT 3,
  allow_transcribe_audio BOOLEAN DEFAULT true,
  allow_understand_images BOOLEAN DEFAULT true,
  allow_voice_response BOOLEAN DEFAULT true,
  allow_calendar_integration BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela principal para configurações de agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  
  evolution_bot_id VARCHAR(255),
  evolution_instance_name VARCHAR(255) NOT NULL,

  name VARCHAR(255) NOT NULL,
  description TEXT, 
  prompt TEXT,
  tone_of_voice VARCHAR(100) DEFAULT 'friendly',
  primary_function VARCHAR(100) DEFAULT 'general',
  language VARCHAR(10) DEFAULT 'pt-BR',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  
  transcribe_audio BOOLEAN DEFAULT false,
  understand_images BOOLEAN DEFAULT false,
  voice_response_enabled BOOLEAN DEFAULT false,
  voice_provider VARCHAR(50),
  voice_api_key TEXT,
  calendar_integration_enabled BOOLEAN DEFAULT false,
  calendar_api_key TEXT,
  
  trigger_type VARCHAR(50) DEFAULT 'all',
  trigger_operator VARCHAR(20) DEFAULT 'contains',
  trigger_value TEXT,
  keyword_finish VARCHAR(255),
  delay_message INTEGER DEFAULT 1000,
  unknown_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular?',
  listening_from_me BOOLEAN DEFAULT false,
  stop_bot_from_me BOOLEAN DEFAULT false,
  keep_open BOOLEAN DEFAULT false,
  debounce_time INTEGER DEFAULT 0,
  
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  
  n8n_webhook_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON ai_agents(is_default);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_agent_settings_updated_at BEFORE UPDATE ON user_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_global_agent_settings_updated_at BEFORE UPDATE ON global_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configurações globais padrão
INSERT INTO global_agent_settings (setting_key, setting_value, description) VALUES
('default_max_agents_per_user', '3', 'Número máximo padrão de agentes por usuário'),
('n8n_base_url_for_agents', '""', 'URL base do n8n para webhooks de agentes'),
('n8n_api_key_for_agents', '""', 'API Key do n8n para agentes'),
('allow_transcribe_audio_global', 'true', 'Permitir transcrição de áudio globalmente'),
('allow_understand_images_global', 'true', 'Permitir entendimento de imagens globalmente'),
('allow_voice_response_global', 'true', 'Permitir resposta por voz globalmente'),
('allow_calendar_integration_global', 'true', 'Permitir integração com calendário globalmente'),
('voice_providers_enabled', '["fish_audio", "eleven_labs"]', 'Provedores de voz habilitados'),
('calendar_providers_enabled', '["cal_com"]', 'Provedores de calendário habilitados')
ON CONFLICT (setting_key) DO NOTHING;
