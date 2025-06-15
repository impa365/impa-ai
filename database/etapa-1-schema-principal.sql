-- ============================================
-- ETAPA 1: CRIAÇÃO DO SCHEMA E TABELAS PRINCIPAIS
-- Execute este script primeiro no Supabase
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

-- 4. Criar função para gerar API keys
CREATE OR REPLACE FUNCTION impaai.generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'impa_' || replace(gen_random_uuid()::text, '-', '');
END;
$$ language 'plpgsql';

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- 5. Tabela de perfis de usuário
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

-- 7. Tabela de organizações
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

-- 8. Tabela de conexões WhatsApp
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

-- 9. Tabela de agentes de IA (estrutura básica)
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
    
    -- Configurações avançadas de comportamento
    is_default BOOLEAN DEFAULT false,
    listen_own_messages BOOLEAN DEFAULT false,
    stop_bot_by_me BOOLEAN DEFAULT true,
    keep_conversation_open BOOLEAN DEFAULT true,
    split_long_messages BOOLEAN DEFAULT true,
    character_wait_time INTEGER DEFAULT 100,
    
    -- Status e metadados
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'training', 'error')),
    last_training_at TIMESTAMP WITH TIME ZONE,
    performance_score DECIMAL(3,2) DEFAULT 0.00,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de configurações do sistema
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
    logo_icon VARCHAR(10) DEFAULT '🤖',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    preview_image_url TEXT,
    created_by UUID REFERENCES impaai.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES BÁSICOS
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

-- Índices para system_settings
CREATE INDEX idx_system_settings_key ON impaai.system_settings(setting_key);
CREATE INDEX idx_system_settings_category ON impaai.system_settings(category);
CREATE INDEX idx_system_settings_public ON impaai.system_settings(is_public) WHERE is_public = true;

-- Índices para system_themes
CREATE INDEX idx_system_themes_active ON impaai.system_themes(is_active);
CREATE INDEX idx_system_themes_default ON impaai.system_themes(is_default);
CREATE INDEX idx_system_themes_name ON impaai.system_themes(name);

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

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'ETAPA 1 CONCLUÍDA: Schema e tabelas principais criadas' as status;
