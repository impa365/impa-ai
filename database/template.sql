-- =====================================================
-- LUNA AI ASSIST - TEMPLATE SQL COMPLETO
-- =====================================================
-- Este arquivo contém toda a estrutura necessária para o sistema
-- Inclui tabelas, índices, políticas RLS e usuários iniciais

-- =====================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_picture TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    department VARCHAR(255)
);

-- Tabela de configurações de tema
CREATE TABLE IF NOT EXISTS public.theme_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) NOT NULL DEFAULT 'default',
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    secondary_color VARCHAR(7) DEFAULT '#10b981',
    accent_color VARCHAR(7) DEFAULT '#f59e0b',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#1f2937',
    sidebar_color VARCHAR(7) DEFAULT '#f8fafc',
    logo_emoji VARCHAR(10) DEFAULT '🤖',
    logo_url TEXT,
    favicon_url TEXT,
    font_family VARCHAR(100) DEFAULT 'Inter',
    font_size VARCHAR(20) DEFAULT 'medium',
    border_radius VARCHAR(20) DEFAULT 'medium',
    spacing VARCHAR(20) DEFAULT 'normal',
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de integrações
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('evolution_api', 'n8n', 'openai', 'anthropic')),
    name VARCHAR(255) NOT NULL,
    base_url TEXT,
    api_key TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_tested TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(20) DEFAULT 'pending' CHECK (test_status IN ('pending', 'success', 'error'))
);

-- Tabela de conexões WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    phone_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    qr_code TEXT,
    profile_picture_url TEXT,
    integration_id UUID REFERENCES public.integration_settings(id) ON DELETE SET NULL,
    webhook_events JSONB DEFAULT '[]',
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT,
    business_hours_enabled BOOLEAN DEFAULT false,
    business_hours_start TIME,
    business_hours_end TIME,
    business_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_connected TIMESTAMP WITH TIME ZONE,
    connection_count INTEGER DEFAULT 0,
    
    UNIQUE(user_id, instance_name)
);

-- Tabela de agentes de IA
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_provider VARCHAR(50) NOT NULL CHECK (model_provider IN ('openai', 'anthropic', 'local')),
    model_name VARCHAR(100) NOT NULL,
    system_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000,
    top_p DECIMAL(3,2) DEFAULT 1.0 CHECK (top_p >= 0 AND top_p <= 1),
    frequency_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
    presence_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2),
    is_active BOOLEAN DEFAULT true,
    integration_id UUID REFERENCES public.integration_settings(id) ON DELETE SET NULL,
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL,
    auto_response_enabled BOOLEAN DEFAULT false,
    response_delay_seconds INTEGER DEFAULT 0,
    knowledge_base JSONB DEFAULT '{}',
    conversation_memory_enabled BOOLEAN DEFAULT true,
    conversation_memory_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id) ON DELETE CASCADE,
    ai_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    contact_profile_picture TEXT,
    is_group BOOLEAN DEFAULT false,
    group_name VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending', 'spam')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(whatsapp_connection_id, contact_phone)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR(255),
    sender_phone VARCHAR(20) NOT NULL,
    sender_name VARCHAR(255),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'sticker')),
    content TEXT,
    media_url TEXT,
    media_mime_type VARCHAR(100),
    media_size INTEGER,
    media_caption TEXT,
    is_from_me BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    ai_generated BOOLEAN DEFAULT false,
    ai_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
    processing_status VARCHAR(20) DEFAULT 'received' CHECK (processing_status IN ('received', 'processing', 'processed', 'error')),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    intent VARCHAR(100),
    entities JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(whatsapp_message_id)
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'whatsapp', 'ai', 'system', 'security')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_label VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Índices para theme_settings
CREATE INDEX IF NOT EXISTS idx_theme_settings_user_id ON public.theme_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_theme_settings_is_global ON public.theme_settings(is_global);

-- Índices para integration_settings
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON public.integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_type ON public.integration_settings(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_settings_is_active ON public.integration_settings(is_active);

-- Índices para whatsapp_connections
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON public.whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON public.whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance_name ON public.whatsapp_connections(instance_name);

-- Índices para ai_agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_active ON public.ai_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agents_whatsapp_connection_id ON public.ai_agents(whatsapp_connection_id);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp_connection_id ON public.conversations(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON public.conversations(contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_message_id ON public.messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_phone ON public.messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_from_me ON public.messages(is_from_me);
CREATE INDEX IF NOT EXISTS idx_messages_ai_generated ON public.messages(ai_generated);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- =====================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas que têm updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON public.theme_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON public.integration_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON public.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON public.ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all users" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para theme_settings
CREATE POLICY "Users can manage own theme settings" ON public.theme_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view global theme settings" ON public.theme_settings FOR SELECT USING (is_global = true);
CREATE POLICY "Admins can manage all theme settings" ON public.theme_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para integration_settings
CREATE POLICY "Users can manage own integrations" ON public.integration_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all integrations" ON public.integration_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para whatsapp_connections
CREATE POLICY "Users can manage own connections" ON public.whatsapp_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all connections" ON public.whatsapp_connections FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para ai_agents
CREATE POLICY "Users can manage own agents" ON public.ai_agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all agents" ON public.ai_agents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para conversations
CREATE POLICY "Users can manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all conversations" ON public.conversations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para messages
CREATE POLICY "Users can manage own messages" ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para user_sessions
CREATE POLICY "Users can manage own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 6. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_category VARCHAR(50) DEFAULT 'general',
    p_action_url TEXT DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id, title, message, type, category,
        action_url, action_label, expires_at
    ) VALUES (
        p_user_id, p_title, p_message, p_type, p_category,
        p_action_url, p_action_label, p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DADOS INICIAIS - USUÁRIOS
-- =====================================================

-- Inserir usuário administrador
INSERT INTO public.users (
    id,
    email,
    password_hash,
    name,
    role,
    is_active,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@impaai.com',
    crypt('admin123', gen_salt('bf')), -- Senha: admin123
    'Administrador',
    'admin',
    true,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário comum
INSERT INTO public.users (
    id,
    email,
    password_hash,
    name,
    role,
    is_active,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'user@impaai.com',
    crypt('user123', gen_salt('bf')), -- Senha: user123
    'Usuário Teste',
    'user',
    true,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 8. CONFIGURAÇÕES INICIAIS DE TEMA
-- =====================================================

-- Tema padrão global
INSERT INTO public.theme_settings (
    id,
    user_id,
    theme_name,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    sidebar_color,
    logo_emoji,
    font_family,
    font_size,
    border_radius,
    spacing,
    is_global,
    created_at
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001', -- Admin user
    'Tema Padrão Impa AI',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ffffff',
    '#1f2937',
    '#f8fafc',
    '🤖',
    'Inter',
    'medium',
    'medium',
    'normal',
    true,
    NOW()
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas de usuários
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT wc.id) as whatsapp_connections,
    COUNT(DISTINCT aa.id) as ai_agents,
    COUNT(DISTINCT c.id) as conversations,
    COUNT(DISTINCT m.id) as messages,
    u.last_login,
    u.created_at
FROM public.users u
LEFT JOIN public.whatsapp_connections wc ON u.id = wc.user_id
LEFT JOIN public.ai_agents aa ON u.id = aa.user_id
LEFT JOIN public.conversations c ON u.id = c.user_id
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY u.id, u.name, u.email, u.role, u.last_login, u.created_at;

-- View para conversas ativas
CREATE OR REPLACE VIEW active_conversations AS
SELECT 
    c.*,
    u.name as user_name,
    u.email as user_email,
    wc.display_name as connection_name,
    wc.phone_number as connection_phone,
    aa.name as agent_name,
    (SELECT COUNT(*) FROM public.messages m WHERE m.conversation_id = c.id) as message_count,
    (SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
FROM public.conversations c
JOIN public.users u ON c.user_id = u.id
JOIN public.whatsapp_connections wc ON c.whatsapp_connection_id = wc.id
LEFT JOIN public.ai_agents aa ON c.ai_agent_id = aa.id
WHERE c.status = 'active'
ORDER BY c.last_message_at DESC;

-- =====================================================
-- 10. COMENTÁRIOS FINAIS
-- =====================================================

-- Criar comentários nas tabelas para documentação
COMMENT ON TABLE public.users IS 'Tabela de usuários do sistema';
COMMENT ON TABLE public.theme_settings IS 'Configurações de tema personalizáveis';
COMMENT ON TABLE public.integration_settings IS 'Configurações de integrações externas';
COMMENT ON TABLE public.whatsapp_connections IS 'Conexões WhatsApp via Evolution API';
COMMENT ON TABLE public.ai_agents IS 'Agentes de IA configuráveis';
COMMENT ON TABLE public.conversations IS 'Conversas do WhatsApp';
COMMENT ON TABLE public.messages IS 'Mensagens das conversas';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria do sistema';
COMMENT ON TABLE public.notifications IS 'Notificações para usuários';
COMMENT ON TABLE public.user_sessions IS 'Sessões ativas de usuários';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script em seu banco PostgreSQL/Supabase
-- 2. Usuários criados:
--    - Admin: admin@impaai.com / admin123
--    - User:  user@impaai.com / user123
-- 3. Todas as tabelas, índices e políticas RLS estão configuradas
-- 4. O sistema está pronto para uso!
-- =====================================================
