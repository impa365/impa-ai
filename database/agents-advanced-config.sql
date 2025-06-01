-- Adicionar campos específicos para configurações avançadas de voz e calendário
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS voice_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS calendar_meeting_id VARCHAR(255);

-- Verificar se os campos já existem antes de adicionar
DO $$ 
BEGIN
    -- Verificar e adicionar campos se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_agents' AND column_name = 'voice_id') THEN
        ALTER TABLE ai_agents ADD COLUMN voice_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_agents' AND column_name = 'calendar_meeting_id') THEN
        ALTER TABLE ai_agents ADD COLUMN calendar_meeting_id VARCHAR(255);
    END IF;
END $$;

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_ai_agents_voice_provider ON ai_agents(voice_provider);
CREATE INDEX IF NOT EXISTS idx_ai_agents_voice_response_enabled ON ai_agents(voice_response_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_agents_calendar_integration ON ai_agents(calendar_integration);

-- Criar tabela para logs de uso de voz (para monitoramento e billing)
CREATE TABLE IF NOT EXISTS agent_voice_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('fish_audio', 'eleven_labs')),
    voice_id VARCHAR(255) NOT NULL,
    characters_count INTEGER NOT NULL DEFAULT 0,
    audio_duration_seconds DECIMAL(10,2),
    cost_estimate DECIMAL(10,4),
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_status VARCHAR(20) DEFAULT 'success' CHECK (response_status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para logs de uso do calendário
CREATE TABLE IF NOT EXISTS agent_calendar_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    meeting_id VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create_meeting', 'update_meeting', 'cancel_meeting', 'get_availability')),
    participant_email VARCHAR(255),
    meeting_date TIMESTAMP WITH TIME ZONE,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_status VARCHAR(20) DEFAULT 'success' CHECK (response_status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para as tabelas de logs
CREATE INDEX IF NOT EXISTS idx_agent_voice_usage_logs_agent_id ON agent_voice_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_voice_usage_logs_created_at ON agent_voice_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_voice_usage_logs_provider ON agent_voice_usage_logs(provider);

CREATE INDEX IF NOT EXISTS idx_agent_calendar_usage_logs_agent_id ON agent_calendar_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_calendar_usage_logs_created_at ON agent_calendar_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_calendar_usage_logs_action_type ON agent_calendar_usage_logs(action_type);

-- Inserir configurações padrão do sistema para voz e calendário
INSERT INTO agent_system_settings (setting_key, setting_value) VALUES
('voice_providers_config', '{
    "fish_audio": {
        "name": "Fish Audio",
        "api_url": "https://api.fish.audio/v1",
        "supported_languages": ["pt-BR", "en-US", "es-ES"],
        "max_characters": 5000,
        "cost_per_character": 0.0001
    },
    "eleven_labs": {
        "name": "Eleven Labs",
        "api_url": "https://api.elevenlabs.io/v1",
        "supported_languages": ["pt-BR", "en-US", "es-ES"],
        "max_characters": 2500,
        "cost_per_character": 0.0002
    }
}'),
('calendar_providers_config', '{
    "cal_com": {
        "name": "Cal.com",
        "api_url": "https://api.cal.com/v1",
        "supported_features": ["create_meeting", "update_meeting", "cancel_meeting", "get_availability"],
        "max_meetings_per_day": 50
    }
}'),
('default_voice_settings', '{
    "fish_audio": {
        "default_voice_id": "default_pt_br",
        "speed": 1.0,
        "pitch": 1.0
    },
    "eleven_labs": {
        "default_voice_id": "21m00Tcm4TlvDq8ikWAM",
        "stability": 0.5,
        "similarity_boost": 0.5
    }
}')
ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Criar função para validar configurações de voz
CREATE OR REPLACE FUNCTION validate_voice_config(
    provider VARCHAR(20),
    api_key TEXT,
    voice_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validações básicas
    IF provider IS NULL OR api_key IS NULL OR voice_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF provider NOT IN ('fish_audio', 'eleven_labs') THEN
        RETURN FALSE;
    END IF;
    
    IF LENGTH(api_key) < 10 THEN
        RETURN FALSE;
    END IF;
    
    IF LENGTH(voice_id) < 3 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Criar função para validar configurações de calendário
CREATE OR REPLACE FUNCTION validate_calendar_config(
    api_key TEXT,
    meeting_id VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validações básicas
    IF api_key IS NULL OR meeting_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF LENGTH(api_key) < 10 THEN
        RETURN FALSE;
    END IF;
    
    IF LENGTH(meeting_id) < 3 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar configurações antes de inserir/atualizar
CREATE OR REPLACE FUNCTION validate_agent_integrations()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar configurações de voz se habilitada
    IF NEW.voice_response_enabled = TRUE THEN
        IF NOT validate_voice_config(NEW.voice_provider, NEW.voice_api_key, NEW.voice_id) THEN
            RAISE EXCEPTION 'Configurações de voz inválidas. Verifique o provedor, API key e ID da voz.';
        END IF;
    END IF;
    
    -- Validar configurações de calendário se habilitada
    IF NEW.calendar_integration = TRUE THEN
        IF NOT validate_calendar_config(NEW.calendar_api_key, NEW.calendar_meeting_id) THEN
            RAISE EXCEPTION 'Configurações de calendário inválidas. Verifique a API key e ID da reunião.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela ai_agents
DROP TRIGGER IF EXISTS validate_agent_integrations_trigger ON ai_agents;
CREATE TRIGGER validate_agent_integrations_trigger
    BEFORE INSERT OR UPDATE ON ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION validate_agent_integrations();

-- Criar view para estatísticas de uso de integrações
CREATE OR REPLACE VIEW agent_integration_stats AS
SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.voice_response_enabled,
    a.voice_provider,
    a.calendar_integration,
    
    -- Estatísticas de voz
    COALESCE(v.total_voice_requests, 0) as total_voice_requests,
    COALESCE(v.total_characters, 0) as total_characters,
    COALESCE(v.total_voice_cost, 0) as total_voice_cost,
    
    -- Estatísticas de calendário
    COALESCE(c.total_calendar_requests, 0) as total_calendar_requests,
    COALESCE(c.total_meetings_created, 0) as total_meetings_created,
    
    -- Última atividade
    GREATEST(v.last_voice_usage, c.last_calendar_usage) as last_integration_usage
    
FROM ai_agents a
LEFT JOIN (
    SELECT 
        agent_id,
        COUNT(*) as total_voice_requests,
        SUM(characters_count) as total_characters,
        SUM(cost_estimate) as total_voice_cost,
        MAX(created_at) as last_voice_usage
    FROM agent_voice_usage_logs
    WHERE response_status = 'success'
    GROUP BY agent_id
) v ON a.id = v.agent_id
LEFT JOIN (
    SELECT 
        agent_id,
        COUNT(*) as total_calendar_requests,
        COUNT(CASE WHEN action_type = 'create_meeting' THEN 1 END) as total_meetings_created,
        MAX(created_at) as last_calendar_usage
    FROM agent_calendar_usage_logs
    WHERE response_status = 'success'
    GROUP BY agent_id
) c ON a.id = c.agent_id;
