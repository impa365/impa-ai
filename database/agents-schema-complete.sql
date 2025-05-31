-- Criar tabela para agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    whatsapp_connection_id UUID NOT NULL REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    evolution_bot_id VARCHAR(255) UNIQUE, -- ID do bot na Evolution API
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT, -- Identidade do agente
    training_prompt TEXT, -- Prompt de treinamento
    
    -- Configurações de personalidade
    tone_of_voice VARCHAR(50) DEFAULT 'humanizado' CHECK (tone_of_voice IN ('humanizado', 'formal', 'tecnico', 'casual', 'comercial')),
    primary_function VARCHAR(50) DEFAULT 'atendimento' CHECK (primary_function IN ('atendimento', 'vendas', 'agendamento', 'suporte', 'qualificacao')),
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    
    -- Recursos avançados
    transcribe_audio BOOLEAN DEFAULT false,
    understand_images BOOLEAN DEFAULT false,
    voice_response_enabled BOOLEAN DEFAULT false,
    voice_provider VARCHAR(20) CHECK (voice_provider IN ('fish_audio', 'eleven_labs')),
    voice_api_key TEXT,
    calendar_integration_enabled BOOLEAN DEFAULT false,
    calendar_api_key TEXT, -- Cal.com API key
    
    -- Configurações do bot Evolution
    trigger_type VARCHAR(20) DEFAULT 'keyword' CHECK (trigger_type IN ('all', 'keyword')),
    trigger_operator VARCHAR(20) DEFAULT 'contains' CHECK (trigger_operator IN ('contains', 'equals', 'startsWith', 'endsWith', 'regex', 'none')),
    trigger_value VARCHAR(255),
    keyword_finish VARCHAR(50) DEFAULT '#SAIR',
    delay_message INTEGER DEFAULT 1000,
    unknown_message TEXT DEFAULT 'Mensagem não reconhecida',
    listening_from_me BOOLEAN DEFAULT false,
    stop_bot_from_me BOOLEAN DEFAULT false,
    keep_open BOOLEAN DEFAULT false,
    debounce_time INTEGER DEFAULT 0,
    ignore_groups BOOLEAN DEFAULT true,
    split_messages BOOLEAN DEFAULT true,
    time_per_char INTEGER DEFAULT 50,
    expire_time INTEGER DEFAULT 0,
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training', 'error')),
    is_default BOOLEAN DEFAULT false, -- Se é o bot padrão da conexão
    enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para configurações globais de agentes
CREATE TABLE IF NOT EXISTS global_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para configurações de agentes por usuário
CREATE TABLE IF NOT EXISTS user_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    max_agents INTEGER DEFAULT 5,
    transcribe_audio_enabled BOOLEAN DEFAULT true,
    understand_images_enabled BOOLEAN DEFAULT true,
    voice_response_enabled BOOLEAN DEFAULT true,
    calendar_integration_enabled BOOLEAN DEFAULT true,
    fish_audio_enabled BOOLEAN DEFAULT true,
    eleven_labs_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON ai_agents(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_evolution_bot_id ON ai_agents(evolution_bot_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_default ON ai_agents(is_default);
CREATE INDEX IF NOT EXISTS idx_user_agent_settings_user_id ON user_agent_settings(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_global_agent_settings_updated_at BEFORE UPDATE ON global_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_agent_settings_updated_at BEFORE UPDATE ON user_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Constraint para garantir apenas um bot padrão por conexão
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_agents_unique_default_per_connection 
ON ai_agents(whatsapp_connection_id) 
WHERE is_default = true;

-- Inserir configurações globais padrão
INSERT INTO global_agent_settings (setting_key, setting_value, description) VALUES
('default_max_agents_per_user', '5', 'Número máximo padrão de agentes por usuário'),
('transcribe_audio_global_enabled', 'true', 'Habilitar transcrição de áudio globalmente'),
('understand_images_global_enabled', 'true', 'Habilitar entendimento de imagens globalmente'),
('voice_response_global_enabled', 'true', 'Habilitar resposta por voz globalmente'),
('calendar_integration_global_enabled', 'true', 'Habilitar integração com agenda globalmente'),
('fish_audio_global_enabled', 'true', 'Habilitar Fish Audio globalmente'),
('eleven_labs_global_enabled', 'true', 'Habilitar Eleven Labs globalmente'),
('n8n_base_url_for_agents', '""', 'URL base do N8N para agentes'),
('n8n_api_key_for_agents', '""', 'API Key do N8N para agentes')
ON CONFLICT (setting_key) DO NOTHING;

-- Inserir configurações padrão para usuários existentes
INSERT INTO user_agent_settings (user_id, max_agents)
SELECT id, 5 FROM user_profiles 
WHERE id NOT IN (SELECT user_id FROM user_agent_settings);
