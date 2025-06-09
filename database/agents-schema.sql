-- Tabela para configurações de agentes
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  evolution_bot_id VARCHAR(255) UNIQUE,
  
  -- Informações básicas do agente
  name VARCHAR(255) NOT NULL,
  identity_description TEXT,
  training_prompt TEXT NOT NULL,
  
  -- Configurações de comportamento
  voice_tone VARCHAR(50) NOT NULL CHECK (voice_tone IN ('humanizado', 'formal', 'tecnico', 'casual', 'comercial')),
  main_function VARCHAR(50) NOT NULL CHECK (main_function IN ('atendimento', 'vendas', 'agendamento', 'suporte', 'qualificacao')),
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  
  -- Funcionalidades habilitadas
  transcribe_audio BOOLEAN DEFAULT false,
  understand_images BOOLEAN DEFAULT false,
  voice_response_enabled BOOLEAN DEFAULT false,
  voice_provider VARCHAR(20) CHECK (voice_provider IN ('fish_audio', 'eleven_labs')),
  voice_api_key TEXT,
  calendar_integration BOOLEAN DEFAULT false,
  calendar_api_key TEXT,
  
  -- Status e metadados
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training', 'error')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que só existe um agente padrão por conexão
  UNIQUE(whatsapp_connection_id, is_default) WHERE is_default = true
);

-- Tabela para configurações de limites de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  agents_limit INTEGER DEFAULT 1,
  
  -- Integrações habilitadas para o usuário
  transcribe_audio_enabled BOOLEAN DEFAULT true,
  understand_images_enabled BOOLEAN DEFAULT true,
  voice_response_enabled BOOLEAN DEFAULT false,
  calendar_integration_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações globais de agentes
CREATE TABLE IF NOT EXISTS agent_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão do sistema
INSERT INTO agent_system_settings (setting_key, setting_value) VALUES
('default_agents_limit', '1'),
('global_transcribe_audio_enabled', 'true'),
('global_understand_images_enabled', 'true'),
('global_voice_response_enabled', 'false'),
('global_calendar_integration_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- Tabela para logs de atividade dos agentes
CREATE TABLE IF NOT EXISTS agent_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_evolution_bot_id ON ai_agents(evolution_bot_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_agent_id ON agent_activity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_created_at ON agent_activity_logs(created_at);

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
CREATE TRIGGER update_agent_system_settings_updated_at BEFORE UPDATE ON agent_system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
