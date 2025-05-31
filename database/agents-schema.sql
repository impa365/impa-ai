-- Tabela para configurações de agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
  evolution_bot_id VARCHAR(255), -- ID do bot na Evolution API
  
  -- Informações básicas do agente
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  
  -- Configurações de personalidade
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
  calendar_api_key TEXT,
  
  -- Configurações do bot Evolution
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
  ignore_groups BOOLEAN DEFAULT true,
  split_messages BOOLEAN DEFAULT true,
  time_per_char INTEGER DEFAULT 50,
  expire_time INTEGER DEFAULT 0,
  
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
  voice_response_enabled BOOLEAN DEFAULT true,
  calendar_integration_enabled BOOLEAN DEFAULT true,
  transcribe_audio_enabled BOOLEAN DEFAULT true,
  understand_images_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela para configurações globais de agentes
CREATE TABLE IF NOT EXISTS global_agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO global_agent_settings (setting_key, setting_value, description) VALUES
('default_max_agents', '3', 'Limite padrão de agentes por usuário'),
('voice_response_global_enabled', 'true', 'Habilitar resposta por voz globalmente'),
('calendar_integration_global_enabled', 'true', 'Habilitar integração de agenda globalmente'),
('transcribe_audio_global_enabled', 'true', 'Habilitar transcrição de áudio globalmente'),
('understand_images_global_enabled', 'true', 'Habilitar entendimento de imagens globalmente'),
('fish_audio_enabled', 'true', 'Habilitar Fish Audio'),
('eleven_labs_enabled', 'true', 'Habilitar Eleven Labs'),
('cal_com_enabled', 'true', 'Habilitar Cal.com')
ON CONFLICT (setting_key) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON ai_agents(is_default);

-- Constraint para garantir apenas um agente padrão por conexão
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_agents_default_per_connection 
ON ai_agents(whatsapp_connection_id) 
WHERE is_default = true;

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
