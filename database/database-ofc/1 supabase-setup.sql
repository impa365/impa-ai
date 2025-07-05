-- ============================================
-- IMPA AI - SETUP COMPLETO PARA SUPABASE
-- Execute este script no seu Supabase
-- ============================================

-- 1. CRIAR SCHEMA E FUNÇÕES BÁSICAS
-- ============================================

CREATE SCHEMA IF NOT EXISTS impaai;
SET search_path TO impaai;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION impaai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar API keys
CREATE OR REPLACE FUNCTION impaai.generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'impaai_' || replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

-- 2. TABELAS PRINCIPAIS
-- ============================================

-- Tabela de usuários
CREATE TABLE impaai.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Informações pessoais
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    bio TEXT,
    timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    
    -- API e configurações
    api_key VARCHAR(255) UNIQUE DEFAULT impaai.generate_api_key(),
    email_verified BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{"mode": "light", "color": "blue"}',
    
    -- Limites
    agents_limit INTEGER DEFAULT 3,
    connections_limit INTEGER DEFAULT 5,
    monthly_messages_limit INTEGER DEFAULT 1000,
    
    -- Metadados
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de API keys dos usuários
CREATE TABLE impaai.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT impaai.generate_api_key(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '["read"]',
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conexões WhatsApp
CREATE TABLE impaai.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    
    -- Informações da conexão
    connection_name VARCHAR(255) NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    instance_id VARCHAR(255),
    instance_token TEXT,
    phone_number VARCHAR(20),
    
    -- Status e configurações
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error', 'banned')),
    qr_code TEXT,
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    webhook_url TEXT,
    webhook_events JSONB DEFAULT '["message"]',
    
    -- Configurações avançadas
    settings JSONB DEFAULT '{}',
    auto_reconnect BOOLEAN DEFAULT true,
    max_reconnect_attempts INTEGER DEFAULT 5,
    reconnect_interval INTEGER DEFAULT 30,
    
    -- Estatísticas
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    uptime_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, instance_name)
);

-- Tabela de agentes de IA
CREATE TABLE impaai.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    whatsapp_connection_id UUID REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL,
    evolution_bot_id VARCHAR(255) UNIQUE,
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    identity_description TEXT,
    training_prompt TEXT NOT NULL,
    
    -- Configurações de comportamento
    voice_tone VARCHAR(50) NOT NULL DEFAULT 'humanizado' CHECK (voice_tone IN ('humanizado', 'formal', 'tecnico', 'casual', 'comercial')),
    main_function VARCHAR(50) NOT NULL DEFAULT 'atendimento' CHECK (main_function IN ('atendimento', 'vendas', 'agendamento', 'suporte', 'qualificacao')),
    
    -- Configurações do modelo
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000,
    top_p DECIMAL(3,2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
    presence_penalty DECIMAL(3,2) DEFAULT 0.0,
    model_config JSONB DEFAULT '{}',
    
    -- Funcionalidades básicas
    transcribe_audio BOOLEAN DEFAULT false,
    understand_images BOOLEAN DEFAULT false,
    voice_response_enabled BOOLEAN DEFAULT false,
    voice_provider VARCHAR(20) CHECK (voice_provider IN ('fish_audio', 'eleven_labs')),
    voice_api_key TEXT,
    voice_id VARCHAR(255),
    calendar_integration BOOLEAN DEFAULT false,
    calendar_api_key TEXT,
    calendar_meeting_id VARCHAR(255),
    
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
    trigger_type VARCHAR(50) DEFAULT 'all' CHECK (trigger_type IN ('all', 'mention', 'private', 'group')),
    
    -- Configurações de horário
    working_hours JSONB DEFAULT '{"enabled": false, "timezone": "America/Sao_Paulo", "schedule": {}}',
    auto_responses JSONB DEFAULT '{}',
    fallback_responses JSONB DEFAULT '{}',
    
    -- Status e metadados
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training', 'error')),
    last_training_at TIMESTAMP WITH TIME ZONE,
    performance_score DECIMAL(3,2) DEFAULT 0.00,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE impaai.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    requires_restart BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de temas do sistema
CREATE TABLE impaai.system_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    colors JSONB NOT NULL,
    fonts JSONB DEFAULT '{}',
    borders JSONB DEFAULT '{}',
    logo_icon VARCHAR(10) DEFAULT '🤖',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de integrações
CREATE TABLE impaai.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL UNIQUE,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de atividade dos agentes
CREATE TABLE impaai.agent_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES impaai.ai_agents(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    user_message TEXT,
    agent_response TEXT,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,6),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de atividade geral
CREATE TABLE impaai.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    agent_id UUID REFERENCES impaai.ai_agents(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE impaai.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES impaai.ai_agents(id) ON DELETE CASCADE,
    whatsapp_connection_id UUID REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE impaai.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES impaai.conversations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES impaai.ai_agents(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document')),
    media_url TEXT,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_email ON impaai.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON impaai.user_profiles(role);
CREATE INDEX idx_user_profiles_status ON impaai.user_profiles(status);
CREATE INDEX idx_user_profiles_api_key ON impaai.user_profiles(api_key) WHERE api_key IS NOT NULL;

-- Índices para user_api_keys
CREATE INDEX idx_user_api_keys_user_id ON impaai.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_api_key ON impaai.user_api_keys(api_key);
CREATE INDEX idx_user_api_keys_active ON impaai.user_api_keys(is_active) WHERE is_active = true;

-- Índices para whatsapp_connections
CREATE INDEX idx_whatsapp_connections_user_id ON impaai.whatsapp_connections(user_id);
CREATE INDEX idx_whatsapp_connections_status ON impaai.whatsapp_connections(status);
CREATE INDEX idx_whatsapp_connections_instance ON impaai.whatsapp_connections(instance_name);

-- Índices para ai_agents
CREATE INDEX idx_ai_agents_user_id ON impaai.ai_agents(user_id);
CREATE INDEX idx_ai_agents_status ON impaai.ai_agents(status);
CREATE INDEX idx_ai_agents_whatsapp_connection ON impaai.ai_agents(whatsapp_connection_id);
CREATE INDEX idx_ai_agents_evolution_bot_id ON impaai.ai_agents(evolution_bot_id);

-- Índice único parcial para agente padrão
CREATE UNIQUE INDEX idx_ai_agents_default_per_connection 
ON impaai.ai_agents(whatsapp_connection_id) 
WHERE is_default = true;

-- Índices para logs
CREATE INDEX idx_agent_activity_logs_agent_id ON impaai.agent_activity_logs(agent_id);
CREATE INDEX idx_agent_activity_logs_created_at ON impaai.agent_activity_logs(created_at);
CREATE INDEX idx_activity_logs_user_id ON impaai.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON impaai.activity_logs(created_at);

-- Índices para conversas e mensagens
CREATE INDEX idx_conversations_agent_id ON impaai.conversations(agent_id);
CREATE INDEX idx_conversations_contact_phone ON impaai.conversations(contact_phone);
CREATE INDEX idx_messages_conversation_id ON impaai.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON impaai.messages(created_at);

-- Índices para configurações
CREATE INDEX idx_system_settings_key ON impaai.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON impaai.system_settings(category);
CREATE INDEX idx_integrations_type ON impaai.integrations(type);
CREATE INDEX idx_integrations_active ON impaai.integrations(is_active);

-- 4. TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON impaai.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON impaai.user_api_keys 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_whatsapp_connections_updated_at 
    BEFORE UPDATE ON impaai.whatsapp_connections 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at 
    BEFORE UPDATE ON impaai.ai_agents 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON impaai.system_settings 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON impaai.conversations 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

-- 5. FUNÇÕES RPC PARA API
-- ============================================

-- Função para criar API key
CREATE OR REPLACE FUNCTION impaai.create_user_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_api_key TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO impaai.user_api_keys (
        user_id, name, api_key, description, permissions, rate_limit, is_active
    ) VALUES (
        p_user_id, p_name, p_api_key, 
        COALESCE(p_description, 'API Key para integração'), 
        '["read"]'::jsonb, 100, true
    );
END;
$$;

-- Função para buscar API key
CREATE OR REPLACE FUNCTION impaai.get_user_api_key_by_key(p_api_key TEXT)
RETURNS TABLE (
    id UUID, user_id UUID, name TEXT, api_key TEXT, 
    description TEXT, permissions JSONB, rate_limit INTEGER, 
    is_active BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.user_id, u.name, u.api_key, u.description, 
           u.permissions, u.rate_limit, u.is_active, u.created_at, u.updated_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;

-- Função para atualizar sincronização de conexão
CREATE OR REPLACE FUNCTION impaai.update_connection_sync(connection_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    UPDATE impaai.whatsapp_connections 
    SET updated_at = current_time
    WHERE id = connection_id;
    
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'updated', true,
            'timestamp', current_time
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Connection not found'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Função para obter tema ativo
CREATE OR REPLACE FUNCTION impaai.get_active_theme()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    theme_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'display_name', display_name,
        'description', description,
        'colors', colors,
        'logo_icon', logo_icon
    ) INTO theme_data
    FROM impaai.system_themes
    WHERE is_active = true
    LIMIT 1;
    
    IF theme_data IS NULL THEN
        SELECT jsonb_build_object(
            'display_name', display_name,
            'description', description,
            'colors', colors,
            'logo_icon', logo_icon
        ) INTO theme_data
        FROM impaai.system_themes
        WHERE is_default = true
        LIMIT 1;
    END IF;
    
    IF theme_data IS NULL THEN
        theme_data := '{"display_name": "Impa AI", "colors": {"primary": "#3b82f6"}, "logo_icon": "🤖"}'::jsonb;
    END IF;
    
    RETURN theme_data;
END;
$$;

-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE impaai.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.agent_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON impaai.user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON impaai.user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para user_api_keys
CREATE POLICY "Users can view own API keys" ON impaai.user_api_keys
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own API keys" ON impaai.user_api_keys
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Políticas para whatsapp_connections
CREATE POLICY "Users can view own connections" ON impaai.whatsapp_connections
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own connections" ON impaai.whatsapp_connections
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Políticas para ai_agents
CREATE POLICY "Users can view own agents" ON impaai.ai_agents
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own agents" ON impaai.ai_agents
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Políticas para logs (somente leitura)
CREATE POLICY "Users can view own agent logs" ON impaai.agent_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM impaai.ai_agents 
            WHERE id = agent_activity_logs.agent_id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Políticas para conversas
CREATE POLICY "Users can view own conversations" ON impaai.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM impaai.ai_agents 
            WHERE id = conversations.agent_id 
            AND user_id::text = auth.uid()::text
        )
    );

-- Políticas para mensagens
CREATE POLICY "Users can view own messages" ON impaai.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM impaai.conversations c
            JOIN impaai.ai_agents a ON c.agent_id = a.id
            WHERE c.id = messages.conversation_id 
            AND a.user_id::text = auth.uid()::text
        )
    );

-- Permitir acesso público às configurações do sistema (somente leitura)
CREATE POLICY "Public read access to system settings" ON impaai.system_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public read access to system themes" ON impaai.system_themes
    FOR SELECT USING (true);

CREATE POLICY "Public read access to integrations" ON impaai.integrations
    FOR SELECT USING (true);

-- 7. PERMISSÕES PARA ANON
-- ============================================

-- Conceder permissões básicas para usuários anônimos
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT SELECT ON impaai.system_settings TO anon;
GRANT SELECT ON impaai.system_themes TO anon;
GRANT SELECT ON impaai.integrations TO anon;

-- Conceder permissões para usuários autenticados
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA impaai TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA impaai TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO authenticated;

-- 8. DADOS INICIAIS
-- ============================================

-- Configurações do sistema
INSERT INTO impaai.system_settings (setting_key, setting_value, category, description, is_public) VALUES 
('app_name', '"Impa AI"', 'general', 'Nome da aplicação', true),
('app_version', '"1.0.0"', 'general', 'Versão da aplicação', true),
('allow_public_registration', 'false', 'auth', 'Permitir registro público', false),
('max_agents_per_user', '5', 'agents', 'Máximo de agentes por usuário', false),
('default_model', '"gpt-3.5-turbo"', 'agents', 'Modelo padrão', false),
('enable_vector_stores', 'true', 'integrations', 'Habilitar vector stores', false),
('enable_voice_responses', 'true', 'integrations', 'Habilitar respostas por voz', false);

-- Tema padrão
INSERT INTO impaai.system_themes (name, display_name, description, colors, logo_icon, is_default, is_active) VALUES 
('default_blue', 'Impa AI', 'Tema padrão azul da plataforma', 
'{"primary": "#3b82f6", "secondary": "#10b981", "accent": "#8b5cf6", "background": "#ffffff", "text": "#1e293b"}', 
'🤖', true, true);

-- Integrações disponíveis
INSERT INTO impaai.integrations (name, type, config, is_active) VALUES 
('Evolution API', 'evolution_api', '{}', false),
('n8n Automation', 'n8n', '{}', false);

-- Usuário administrador padrão (senha: admin123)
INSERT INTO impaai.user_profiles (
    full_name, email, password_hash, role, status, 
    agents_limit, connections_limit, monthly_messages_limit, email_verified
) VALUES (
    'Administrador do Sistema',
    'admin@impa.ai',
    '$2a$12$LQv3c1yqBwEHxPuNYkGOSuOiUiIq6QEX9K6FhmXEuKtcsNdvQqDAa',
    'admin', 'active', 999, 999, 999999, true
);

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON SCHEMA impaai IS 'Schema principal do sistema Impa AI';
COMMENT ON TABLE impaai.user_profiles IS 'Perfis dos usuários do sistema';
COMMENT ON TABLE impaai.user_api_keys IS 'Chaves de API dos usuários';
COMMENT ON TABLE impaai.whatsapp_connections IS 'Conexões WhatsApp dos usuários';
COMMENT ON TABLE impaai.ai_agents IS 'Agentes de IA configurados';
COMMENT ON TABLE impaai.system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE impaai.system_themes IS 'Temas visuais do sistema';
COMMENT ON TABLE impaai.integrations IS 'Integrações externas disponíveis';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'impaai'
ORDER BY table_name;

-- ============================================
-- SETUP CONCLUÍDO!
-- 
-- CREDENCIAIS PADRÃO:
-- Admin: admin@impa.ai (senha: admin123)
--
-- PRÓXIMOS PASSOS:
-- 1. Configure as variáveis de ambiente no seu projeto
-- 2. Teste a conexão com Supabase
-- 3. Faça login com as credenciais padrão
-- ============================================
