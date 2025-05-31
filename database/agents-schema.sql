-- Atualizar tabela de agentes IA com todas as configurações
DROP TABLE IF EXISTS ai_agents CASCADE;

CREATE TABLE ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  
  -- Informações básicas do agente
  name VARCHAR(100) NOT NULL,
  identity_description TEXT,
  prompt_template TEXT NOT NULL,
  
  -- Configurações de personalidade
  voice_tone VARCHAR(50) DEFAULT 'humanizado' CHECK (voice_tone IN ('humanizado', 'formal', 'tecnico', 'casual', 'comercial')),
  main_function VARCHAR(50) DEFAULT 'atendimento' CHECK (main_function IN ('atendimento', 'vendas', 'agendamento', 'suporte', 'qualificacao')),
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  
  -- Funcionalidades IA
  transcribe_audio BOOLEAN DEFAULT false,
  understand_images BOOLEAN DEFAULT false,
  voice_response_enabled BOOLEAN DEFAULT false,
  voice_provider VARCHAR(20) CHECK (voice_provider IN ('fish_audio', 'eleven_labs')),
  voice_api_key TEXT,
  
  -- Integrações
  calendar_integration BOOLEAN DEFAULT false,
  calendar_provider VARCHAR(20) DEFAULT 'cal_com' CHECK (calendar_provider IN ('cal_com')),
  calendar_api_key TEXT,
  calendar_config JSONB,
  
  -- Evolution API
  evolution_bot_id VARCHAR(100),
  evolution_webhook_url TEXT,
  n8n_webhook_url TEXT,
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training', 'error')),
  is_default_for_connection BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas um agente padrão por conexão
  UNIQUE(whatsapp_connection_id, is_default_for_connection) WHERE is_default_for_connection = true
);

-- Tabela para configurações de limites de agentes
CREATE TABLE IF NOT EXISTS agent_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_agents INTEGER DEFAULT 1,
  transcribe_audio_enabled BOOLEAN DEFAULT true,
  understand_images_enabled BOOLEAN DEFAULT true,
  voice_response_enabled BOOLEAN DEFAULT false,
  calendar_integration_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela para configurações globais de integrações
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão de integrações
INSERT INTO integration_settings (setting_key, setting_value, enabled) VALUES
('fish_audio', '{"enabled": false, "global_api_key": null}', false),
('eleven_labs', '{"enabled": false, "global_api_key": null}', false),
('cal_com', '{"enabled": false, "global_api_key": null}', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Inserir limites padrão para usuários existentes
INSERT INTO agent_limits (user_id, max_agents)
SELECT id, 1 FROM user_profiles 
WHERE id NOT IN (SELECT user_id FROM agent_limits WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_connection ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_limits_user ON agent_limits(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_limits_updated_at BEFORE UPDATE ON agent_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON integration_settings FOR EACH ROW EXECUTE FUNCTION update_integration_settings_updated_at_column();
