-- ============================================
-- ETAPA 5: INSERÇÃO DE DADOS PADRÃO
-- Execute após a Etapa 4
-- ============================================

SET search_path TO impaai, public;

-- Configurações padrão do sistema
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
('theme_customization_enabled', 'true', 'theme', 'Habilitar personalização de tema', false)

ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Temas padrão
INSERT INTO impaai.system_themes (name, display_name, description, colors, logo_icon, is_default, is_active) VALUES 
('light', 'Tema Claro', 'Tema claro padrão do sistema', '{
    "primary": "#3B82F6",
    "secondary": "#64748B", 
    "background": "#FFFFFF",
    "surface": "#F8FAFC",
    "text": "#1E293B",
    "border": "#E2E8F0",
    "accent": "#10B981"
}', '🤖', true, true),

('dark', 'Tema Escuro', 'Tema escuro para uso noturno', '{
    "primary": "#60A5FA",
    "secondary": "#94A3B8",
    "background": "#0F172A", 
    "surface": "#1E293B",
    "text": "#F1F5F9",
    "border": "#334155",
    "accent": "#34D399"
}', '🌙', false, true),

('blue', 'Azul Profissional', 'Tema azul para ambiente corporativo', '{
    "primary": "#2563EB",
    "secondary": "#475569",
    "background": "#FFFFFF",
    "surface": "#F1F5F9", 
    "text": "#1E293B",
    "border": "#CBD5E1",
    "accent": "#0EA5E9"
}', '💼', false, true)

ON CONFLICT (name) DO UPDATE SET
    colors = EXCLUDED.colors,
    logo_icon = EXCLUDED.logo_icon,
    updated_at = NOW();

-- USUÁRIOS PADRÃO
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
) ON CONFLICT (email) DO NOTHING;

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
) ON CONFLICT (email) DO NOTHING;

-- Verificação final
SELECT 
    'user_profiles' as tabela, COUNT(*) as registros FROM impaai.user_profiles
UNION ALL
SELECT 
    'system_settings' as tabela, COUNT(*) as registros FROM impaai.system_settings
UNION ALL
SELECT 
    'system_themes' as tabela, COUNT(*) as registros FROM impaai.system_themes;

-- Mostrar usuários criados
SELECT 
    full_name,
    email,
    role,
    status,
    CASE 
        WHEN email = 'admin@impa.ai' THEN 'Senha: admin123'
        WHEN email = 'user@impa.ai' THEN 'Senha: user123'
        ELSE 'N/A'
    END as credenciais
FROM impaai.user_profiles 
ORDER BY role DESC;

SELECT 'ETAPA 5 CONCLUÍDA: Dados padrão inseridos' as status;
SELECT '🎉 INSTALAÇÃO COMPLETA! Sistema pronto para uso.' as resultado;
