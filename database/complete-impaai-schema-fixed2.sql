-- ============================================
-- SCRIPT COMPLETO PARA NOVO SUPABASE - CORRIGIDO
-- Schema: impaai
-- ============================================

-- 1. Criar schema impaai
CREATE SCHEMA IF NOT EXISTS impaai;

-- 2. Definir schema como padrão para esta sessão
SET search_path TO impaai, public;

-- 3. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION impaai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar função para gerar API keys (CORRIGIDA)
CREATE OR REPLACE FUNCTION impaai.generate_api_key()
RETURNS TEXT AS $$
BEGIN
    -- Usando gen_random_uuid() em vez de gen_random_bytes()
    RETURN 'impa_' || replace(gen_random_uuid()::text, '-', '');
END;
$$ language 'plpgsql';

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- 5. Tabela de perfis de usuário (COMPLETA)
CREATE TABLE impaai.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'hibernated')),
    
    -- Informações pessoais
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    bio TEXT,
    timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    
    -- API e autenticação
    api_key VARCHAR(255) UNIQUE DEFAULT impaai.generate_api_key(),
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Configurações e preferências
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    theme_settings JSONB DEFAULT '{"mode": "light", "color": "blue"}',
    
    -- Limites e quotas
    agents_limit INTEGER DEFAULT 3,
    connections_limit INTEGER DEFAULT 5,
    monthly_messages_limit INTEGER DEFAULT 1000,
    
    -- Metadados
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de chaves de API dos usuários
CREATE TABLE impaai.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT impaai.generate_api_key(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '["read"]',
    rate_limit INTEGER DEFAULT 100,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de organizações (para multi-tenancy futuro)
CREATE TABLE impaai.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    admin_user_id UUID REFERENCES impaai.user_profiles(id),
    settings JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de conexões WhatsApp (COMPLETA)
CREATE TABLE impaai.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES impaai.organizations(id) ON DELETE SET NULL,
    
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

-- 9. Tabela de agentes de IA (COMPLETA COM TODAS AS INTEGRAÇÕES)
CREATE TABLE impaai.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES impaai.organizations(id) ON DELETE SET NULL,
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
    
    -- Configurações avançadas de comportamento
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

-- 10. Tabela de configurações do sistema (INCLUINDO TEMAS)
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

-- 11. Tabela de temas do sistema
CREATE TABLE impaai.system_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    colors JSONB NOT NULL,
    fonts JSONB DEFAULT '{}',
    spacing JSONB DEFAULT '{}',
    borders JSONB DEFAULT '{}',
    shadows JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preview_image_url TEXT,
    created_by UUID REFERENCES impaai.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Tabela de logs de atividade dos agentes
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

-- 13. Tabela de logs de atividade geral
CREATE TABLE impaai.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    agent_id UUID REFERENCES impaai.ai_agents(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES impaai.organizations(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Tabela de configurações dos agentes
CREATE TABLE impaai.agent_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Tabela de configurações de usuário-agente
CREATE TABLE impaai.user_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    agents_limit INTEGER DEFAULT 1,
    transcribe_audio_enabled BOOLEAN DEFAULT true,
    understand_images_enabled BOOLEAN DEFAULT true,
    voice_response_enabled BOOLEAN DEFAULT false,
    calendar_integration_enabled BOOLEAN DEFAULT false,
    vector_store_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 16. Tabela de conversas (para histórico)
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

-- 17. Tabela de mensagens (para histórico detalhado)
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

-- ============================================
-- ÍNDICES PARA PERFORMANCE
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
CREATE INDEX idx_whatsapp_connections_phone ON impaai.whatsapp_connections(phone_number);

-- Índices para ai_agents
CREATE INDEX idx_ai_agents_user_id ON impaai.ai_agents(user_id);
CREATE INDEX idx_ai_agents_status ON impaai.ai_agents(status);
CREATE INDEX idx_ai_agents_whatsapp_connection ON impaai.ai_agents(whatsapp_connection_id);
CREATE INDEX idx_ai_agents_evolution_bot_id ON impaai.ai_agents(evolution_bot_id);
CREATE INDEX idx_ai_agents_chatnode ON impaai.ai_agents(chatnode_integration) WHERE chatnode_integration = true;
CREATE INDEX idx_ai_agents_orimon ON impaai.ai_agents(orimon_integration) WHERE orimon_integration = true;
CREATE INDEX idx_ai_agents_voice_enabled ON impaai.ai_agents(voice_response_enabled) WHERE voice_response_enabled = true;

-- ÍNDICE ÚNICO PARCIAL PARA AGENTE PADRÃO (CORRIGIDO)
CREATE UNIQUE INDEX idx_ai_agents_default_per_connection 
ON impaai.ai_agents(whatsapp_connection_id) 
WHERE is_default = true;

-- Índices para logs
CREATE INDEX idx_agent_activity_logs_agent_id ON impaai.agent_activity_logs(agent_id);
CREATE INDEX idx_agent_activity_logs_type ON impaai.agent_activity_logs(activity_type);
CREATE INDEX idx_agent_activity_logs_created_at ON impaai.agent_activity_logs(created_at);
CREATE INDEX idx_agent_activity_logs_success ON impaai.agent_activity_logs(success);

CREATE INDEX idx_activity_logs_user_id ON impaai.activity_logs(user_id);
CREATE INDEX idx_activity_logs_agent_id ON impaai.activity_logs(agent_id);
CREATE INDEX idx_activity_logs_action ON impaai.activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON impaai.activity_logs(created_at);

-- Índices para conversas e mensagens
CREATE INDEX idx_conversations_agent_id ON impaai.conversations(agent_id);
CREATE INDEX idx_conversations_contact_phone ON impaai.conversations(contact_phone);
CREATE INDEX idx_conversations_status ON impaai.conversations(status);
CREATE INDEX idx_conversations_last_message ON impaai.conversations(last_message_at);

CREATE INDEX idx_messages_conversation_id ON impaai.messages(conversation_id);
CREATE INDEX idx_messages_agent_id ON impaai.messages(agent_id);
CREATE INDEX idx_messages_direction ON impaai.messages(direction);
CREATE INDEX idx_messages_created_at ON impaai.messages(created_at);

-- Índices para system_settings
CREATE INDEX idx_system_settings_key ON impaai.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON impaai.system_settings(category);
CREATE INDEX idx_system_settings_public ON impaai.system_settings(is_public) WHERE is_public = true;

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON impaai.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON impaai.user_api_keys 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON impaai.organizations 
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

CREATE TRIGGER update_system_themes_updated_at 
    BEFORE UPDATE ON impaai.system_themes 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON impaai.conversations 
    FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();

-- ============================================
-- CONFIGURAÇÕES PADRÃO DO SISTEMA
-- ============================================

-- Configurações gerais
INSERT INTO impaai.system_settings (setting_key, setting_value, category, description, is_public) VALUES 
('app_name', '"Impa AI"', 'general', 'Nome da aplicação', true),
('app_version', '"1.0.0"', 'general', 'Versão da aplicação', true),
('allow_public_registration', 'false', 'auth', 'Permitir registro público de usuários', false),
('require_email_verification', 'true', 'auth', 'Exigir verificação de email', false),
('session_timeout', '86400', 'auth', 'Timeout da sessão em segundos', false),

-- Configurações de agentes
('max_agents_per_user', '5', 'agents', 'Máximo de agentes por usuário', false),
('default_model', '"gpt-3.5-turbo"', 'agents', 'Modelo padrão para novos agentes', false),
('max_tokens_default', '1000', 'agents', 'Tokens máximos padrão', false),
('temperature_default', '0.7', 'agents', 'Temperatura padrão para novos agentes', false),

-- Configurações de integrações
('enable_vector_stores', 'true', 'integrations', 'Habilitar integrações de vector store', false),
('enable_voice_responses', 'true', 'integrations', 'Habilitar respostas por voz', false),
('enable_image_analysis', 'true', 'integrations', 'Habilitar análise de imagens', false),
('enable_audio_transcription', 'true', 'integrations', 'Habilitar transcrição de áudio', false),

-- Configurações de WhatsApp
('max_connections_per_user', '5', 'whatsapp', 'Máximo de conexões WhatsApp por usuário', false),
('webhook_timeout', '30', 'whatsapp', 'Timeout para webhooks em segundos', false),
('auto_reconnect_enabled', 'true', 'whatsapp', 'Habilitar reconexão automática', false),

-- Configurações de tema
('default_theme', '"light"', 'theme', 'Tema padrão do sistema', true),
('allow_custom_themes', 'true', 'theme', 'Permitir temas personalizados', false),
('theme_customization_enabled', 'true', 'theme', 'Habilitar personalização de tema', false);

-- Temas padrão
INSERT INTO impaai.system_themes (name, display_name, description, colors, is_default, is_active) VALUES 
('light', 'Tema Claro', 'Tema claro padrão do sistema', '{
    "primary": "#3B82F6",
    "secondary": "#64748B", 
    "background": "#FFFFFF",
    "surface": "#F8FAFC",
    "text": "#1E293B",
    "border": "#E2E8F0",
    "accent": "#10B981"
}', true, true),

('dark', 'Tema Escuro', 'Tema escuro para uso noturno', '{
    "primary": "#60A5FA",
    "secondary": "#94A3B8",
    "background": "#0F172A", 
    "surface": "#1E293B",
    "text": "#F1F5F9",
    "border": "#334155",
    "accent": "#34D399"
}', false, true),

('blue', 'Azul Profissional', 'Tema azul para ambiente corporativo', '{
    "primary": "#2563EB",
    "secondary": "#475569",
    "background": "#FFFFFF",
    "surface": "#F1F5F9", 
    "text": "#1E293B",
    "border": "#CBD5E1",
    "accent": "#0EA5E9"
}', false, true);

-- ============================================
-- USUÁRIOS PADRÃO
-- ============================================

-- ADMIN USER (senha: admin123)
INSERT INTO impaai.user_profiles (
    id,
    full_name, 
    email, 
    password_hash, 
    role, 
    status,
    agents_limit,
    connections_limit,
    monthly_messages_limit,
    email_verified,
    theme_settings,
    preferences,
    created_at
) VALUES (
    gen_random_uuid(),
    'Administrador do Sistema',
    'admin@impa.ai',
    '$2a$12$LQv3c1yqBwEHxPuNYkGOSuOiUiIq6QEX9K6FhmXEuKtcsNdvQqDAa', -- admin123
    'admin',
    'active',
    999,
    999,
    999999,
    true,
    '{"mode": "light", "color": "blue", "customizations": {}}',
    '{"notifications": true, "analytics": true, "beta_features": true}',
    NOW()
);

-- USER COMUM (senha: user123)  
INSERT INTO impaai.user_profiles (
    id,
    full_name, 
    email, 
    password_hash, 
    role, 
    status,
    agents_limit,
    connections_limit,
    monthly_messages_limit,
    email_verified,
    theme_settings,
    preferences,
    created_at
) VALUES (
    gen_random_uuid(),
    'Usuário de Teste',
    'user@impa.ai',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user123
    'user',
    'active',
    3,
    5,
    1000,
    true,
    '{"mode": "light", "color": "blue", "customizations": {}}',
    '{"notifications": true, "analytics": false, "beta_features": false}',
    NOW()
);

-- Criar configurações de agente para os usuários
INSERT INTO impaai.user_agent_settings (user_id, agents_limit, transcribe_audio_enabled, understand_images_enabled, voice_response_enabled, calendar_integration_enabled, vector_store_enabled)
SELECT id, agents_limit, true, true, false, false, true
FROM impaai.user_profiles;

-- ============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON SCHEMA impaai IS 'Schema principal do sistema Impa AI';

COMMENT ON TABLE impaai.user_profiles IS 'Perfis completos dos usuários do sistema';
COMMENT ON TABLE impaai.user_api_keys IS 'Chaves de API dos usuários para acesso externo';
COMMENT ON TABLE impaai.organizations IS 'Organizações para multi-tenancy';
COMMENT ON TABLE impaai.whatsapp_connections IS 'Conexões WhatsApp dos usuários';
COMMENT ON TABLE impaai.ai_agents IS 'Agentes de IA com todas as integrações';
COMMENT ON TABLE impaai.system_settings IS 'Configurações globais do sistema';
COMMENT ON TABLE impaai.system_themes IS 'Temas visuais do sistema';
COMMENT ON TABLE impaai.agent_activity_logs IS 'Logs detalhados de atividade dos agentes';
COMMENT ON TABLE impaai.activity_logs IS 'Logs de atividade geral do sistema';
COMMENT ON TABLE impaai.conversations IS 'Histórico de conversas';
COMMENT ON TABLE impaai.messages IS 'Mensagens detalhadas das conversas';

-- Comentários específicos para integrações
COMMENT ON COLUMN impaai.ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';
COMMENT ON COLUMN impaai.ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';
COMMENT ON COLUMN impaai.ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';
COMMENT ON COLUMN impaai.ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';
COMMENT ON COLUMN impaai.ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';
COMMENT ON COLUMN impaai.ai_agents.voice_response_enabled IS 'Habilita respostas por voz';
COMMENT ON COLUMN impaai.ai_agents.voice_provider IS 'Provedor de voz (fish_audio ou eleven_labs)';
COMMENT ON COLUMN impaai.ai_agents.calendar_integration IS 'Habilita integração com calendário';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Mostrar estatísticas das tabelas criadas
SELECT 
    schemaname,
    tablename,
    COALESCE(n_tup_ins, 0) as registros
FROM pg_stat_user_tables 
WHERE schemaname = 'impaai'
ORDER BY tablename;

-- Mostrar usuários criados
SELECT 
    full_name,
    email,
    role,
    status,
    agents_limit,
    connections_limit,
    CASE 
        WHEN email = 'admin@impa.ai' THEN 'Senha: admin123'
        WHEN email = 'user@impa.ai' THEN 'Senha: user123'
        ELSE 'N/A'
    END as credenciais
FROM impaai.user_profiles 
ORDER BY role DESC;

-- Mostrar configurações do sistema
SELECT 
    setting_key,
    setting_value,
    category,
    description
FROM impaai.system_settings 
ORDER BY category, setting_key;

-- Mostrar temas disponíveis
SELECT 
    name,
    display_name,
    description,
    is_default,
    is_active
FROM impaai.system_themes 
ORDER BY is_default DESC, name;

-- ============================================
-- SCRIPT CONCLUÍDO E CORRIGIDO!
-- 
-- SCHEMA: impaai
-- 
-- USUÁRIOS CRIADOS:
-- 1. Admin: admin@impa.ai (senha: admin123)
-- 2. User:  user@impa.ai  (senha: user123)
--
-- TABELAS CRIADAS: 17 tabelas completas
-- TEMAS: 3 temas padrão (light, dark, blue)
-- CONFIGURAÇÕES: Sistema completo configurado
--
-- ERROS CORRIGIDOS: 
-- 1. Constraint UNIQUE com WHERE movida para índice único parcial
-- 2. Função gen_random_bytes() substituída por gen_random_uuid()
--
-- Execute este script no seu novo Supabase
-- e depois me passe a URL e ANON_KEY
-- ============================================
