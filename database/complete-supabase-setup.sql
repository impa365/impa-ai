-- ============================================
-- SCRIPT COMPLETO PARA NOVO SUPABASE
-- Execute este script no seu novo Supabase
-- ============================================

-- 1. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Criar tabela de perfis de usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    api_key VARCHAR(255) UNIQUE,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de chaves de API dos usuários
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de conexões WhatsApp
CREATE TABLE whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    qr_code TEXT,
    webhook_url TEXT,
    settings JSONB DEFAULT '{}',
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, instance_name)
);

-- 5. Criar tabela de agentes de IA
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID,
    whatsapp_connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT,
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
    
    -- Funcionalidades básicas
    transcribe_audio BOOLEAN DEFAULT false,
    understand_images BOOLEAN DEFAULT false,
    voice_response_enabled BOOLEAN DEFAULT false,
    calendar_integration BOOLEAN DEFAULT false,
    
    -- Integrações de Vector Store
    chatnode_integration BOOLEAN DEFAULT false,
    chatnode_api_key TEXT,
    chatnode_bot_id TEXT,
    orimon_integration BOOLEAN DEFAULT false,
    orimon_api_key TEXT,
    orimon_bot_id TEXT,
    
    -- Configurações avançadas
    is_default BOOLEAN DEFAULT false,
    listen_own_messages BOOLEAN DEFAULT false,
    stop_bot_by_me BOOLEAN DEFAULT true,
    keep_conversation_open BOOLEAN DEFAULT true,
    split_long_messages BOOLEAN DEFAULT true,
    character_wait_time INTEGER DEFAULT 100,
    trigger_type VARCHAR(50) DEFAULT 'all',
    
    -- Configurações de modelo
    model_config JSONB DEFAULT '{}',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela de logs de atividade dos agentes
CREATE TABLE agent_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar tabela de logs de atividade geral
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
    organization_id UUID,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Criar tabela de configurações do sistema
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Criar tabela de configurações dos agentes
CREATE TABLE agent_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Criar tabela de configurações de usuário-agente
CREATE TABLE user_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_id)
);

-- 11. Criar índices para performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_api_key ON user_profiles(api_key) WHERE api_key IS NOT NULL;

CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_api_key ON user_api_keys(api_key);

CREATE INDEX idx_whatsapp_connections_user_id ON whatsapp_connections(user_id);
CREATE INDEX idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX idx_whatsapp_connections_instance ON whatsapp_connections(instance_name);

CREATE INDEX idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_agents_whatsapp_connection ON ai_agents(whatsapp_connection_id);
CREATE INDEX idx_ai_agents_chatnode ON ai_agents(chatnode_integration) WHERE chatnode_integration = true;
CREATE INDEX idx_ai_agents_orimon ON ai_agents(orimon_integration) WHERE orimon_integration = true;

CREATE INDEX idx_agent_activity_logs_agent_id ON agent_activity_logs(agent_id);
CREATE INDEX idx_agent_activity_logs_type ON agent_activity_logs(activity_type);
CREATE INDEX idx_agent_activity_logs_created_at ON agent_activity_logs(created_at);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_agent_id ON activity_logs(agent_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- 12. Criar triggers para updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at 
    BEFORE UPDATE ON whatsapp_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at 
    BEFORE UPDATE ON ai_agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Inserir configurações padrão do sistema
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('allow_public_registration', 'false', 'Permitir registro público de usuários'),
('max_agents_per_user', '5', 'Máximo de agentes por usuário'),
('enable_vector_stores', 'true', 'Habilitar integrações de vector store'),
('default_model', '"gpt-3.5-turbo"', 'Modelo padrão para novos agentes'),
('max_tokens_default', '1000', 'Tokens máximos padrão'),
('temperature_default', '0.7', 'Temperatura padrão para novos agentes'),
('enable_voice_responses', 'true', 'Habilitar respostas por voz'),
('enable_image_analysis', 'true', 'Habilitar análise de imagens'),
('enable_audio_transcription', 'true', 'Habilitar transcrição de áudio'),
('webhook_timeout', '30', 'Timeout para webhooks em segundos');

-- 14. Inserir usuários padrão
-- ADMIN USER (senha: admin123)
INSERT INTO user_profiles (
    id,
    full_name, 
    email, 
    password_hash, 
    role, 
    status,
    api_key,
    created_at
) VALUES (
    gen_random_uuid(),
    'Administrador do Sistema',
    'admin@impa.ai',
    '$2a$12$LQv3c1yqBwEHxPuNYkGOSuOiUiIq6QEX9K6FhmXEuKtcsNdvQqDAa', -- admin123
    'admin',
    'active',
    'impa_admin_' || encode(gen_random_bytes(16), 'hex'),
    NOW()
);

-- USER COMUM (senha: user123)
INSERT INTO user_profiles (
    id,
    full_name, 
    email, 
    password_hash, 
    role, 
    status,
    api_key,
    created_at
) VALUES (
    gen_random_uuid(),
    'Usuário de Teste',
    'user@impa.ai',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user123
    'user',
    'active',
    'impa_user_' || encode(gen_random_bytes(16), 'hex'),
    NOW()
);

-- 15. Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Perfis dos usuários do sistema';
COMMENT ON TABLE user_api_keys IS 'Chaves de API dos usuários para acesso externo';
COMMENT ON TABLE whatsapp_connections IS 'Conexões WhatsApp dos usuários';
COMMENT ON TABLE ai_agents IS 'Agentes de IA configurados pelos usuários';
COMMENT ON TABLE agent_activity_logs IS 'Logs de atividade dos agentes';
COMMENT ON TABLE activity_logs IS 'Logs de atividade geral do sistema';
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';

-- Comentários específicos para vector stores
COMMENT ON COLUMN ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';
COMMENT ON COLUMN ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';
COMMENT ON COLUMN ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';
COMMENT ON COLUMN ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';
COMMENT ON COLUMN ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';
COMMENT ON COLUMN ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';

-- 16. Verificação final - mostrar estatísticas
SELECT 
    'user_profiles' as tabela, COUNT(*) as registros FROM user_profiles
UNION ALL
SELECT 
    'whatsapp_connections' as tabela, COUNT(*) as registros FROM whatsapp_connections
UNION ALL
SELECT 
    'ai_agents' as tabela, COUNT(*) as registros FROM ai_agents
UNION ALL
SELECT 
    'system_settings' as tabela, COUNT(*) as registros FROM system_settings;

-- 17. Mostrar usuários criados
SELECT 
    full_name,
    email,
    role,
    status,
    'Senha: admin123' as senha
FROM user_profiles 
WHERE email = 'admin@impa.ai'
UNION ALL
SELECT 
    full_name,
    email,
    role,
    status,
    'Senha: user123' as senha
FROM user_profiles 
WHERE email = 'user@impa.ai';

-- ============================================
-- SCRIPT CONCLUÍDO!
-- 
-- USUÁRIOS CRIADOS:
-- 1. Admin: admin@impa.ai (senha: admin123)
-- 2. User:  user@impa.ai  (senha: user123)
--
-- Execute este script no seu novo Supabase
-- e depois me passe a URL e ANON_KEY
-- ============================================
