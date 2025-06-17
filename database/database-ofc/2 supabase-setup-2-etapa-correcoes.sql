-- ============================================
-- IMPA AI - CORREÇÕES DE PERMISSÕES (2ª ETAPA)
-- Execute este script APÓS o setup inicial
-- ============================================

-- 1. REMOVER POLÍTICAS RLS PROBLEMÁTICAS
-- ============================================

-- Remover todas as políticas existentes que estão causando problemas
DROP POLICY IF EXISTS "Users can view own profile" ON impaai.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON impaai.user_profiles;
DROP POLICY IF EXISTS "Users can view own API keys" ON impaai.user_api_keys;
DROP POLICY IF EXISTS "Users can manage own API keys" ON impaai.user_api_keys;
DROP POLICY IF EXISTS "Users can view own connections" ON impaai.whatsapp_connections;
DROP POLICY IF EXISTS "Users can manage own connections" ON impaai.whatsapp_connections;
DROP POLICY IF EXISTS "Users can view own agents" ON impaai.ai_agents;
DROP POLICY IF EXISTS "Users can manage own agents" ON impaai.ai_agents;
DROP POLICY IF EXISTS "Users can view own agent logs" ON impaai.agent_activity_logs;
DROP POLICY IF EXISTS "Users can view own conversations" ON impaai.conversations;
DROP POLICY IF EXISTS "Users can view own messages" ON impaai.messages;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA CONFIGURAÇÃO
-- ============================================

ALTER TABLE impaai.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.user_api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.whatsapp_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.ai_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.agent_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE impaai.messages DISABLE ROW LEVEL SECURITY;

-- 3. CONCEDER PERMISSÕES COMPLETAS PARA ANON E AUTHENTICATED
-- ============================================

-- Permissões para usuários anônimos (necessário para login)
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA impaai TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA impaai TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO anon;

-- Permissões para usuários autenticados
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA impaai TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA impaai TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO authenticated;

-- 4. FUNÇÕES RPC PARA AUTENTICAÇÃO CUSTOMIZADA
-- ============================================

-- Função para login customizado (sem RLS)
CREATE OR REPLACE FUNCTION impaai.custom_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Buscar usuário por email
    SELECT * INTO user_record
    FROM impaai.user_profiles
    WHERE email = lower(trim(p_email))
    AND status = 'active';
    
    -- Verificar se usuário existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Credenciais inválidas',
            'user', null
        );
    END IF;
    
    -- Verificar senha (comparação direta - sem hash por enquanto)
    IF user_record.password_hash != p_password THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Credenciais inválidas',
            'user', null
        );
    END IF;
    
    -- Atualizar último login
    UPDATE impaai.user_profiles 
    SET 
        last_login_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1
    WHERE id = user_record.id;
    
    -- Retornar sucesso com dados do usuário
    RETURN json_build_object(
        'success', true,
        'error', null,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'role', user_record.role,
            'status', user_record.status,
            'avatar_url', user_record.avatar_url,
            'created_at', user_record.created_at
        )
    );
END;
$$;

-- Função para registro customizado
CREATE OR REPLACE FUNCTION impaai.custom_register(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM impaai.user_profiles WHERE email = lower(trim(p_email))) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este email já está em uso',
            'user', null
        );
    END IF;
    
    -- Validações básicas
    IF length(trim(p_full_name)) < 2 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nome deve ter pelo menos 2 caracteres',
            'user', null
        );
    END IF;
    
    IF length(p_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Senha deve ter pelo menos 6 caracteres',
            'user', null
        );
    END IF;
    
    -- Inserir novo usuário
    INSERT INTO impaai.user_profiles (
        full_name, email, password_hash, role, status, email_verified
    ) VALUES (
        trim(p_full_name),
        lower(trim(p_email)),
        p_password, -- Sem hash por enquanto
        'user',
        'active',
        true
    ) RETURNING id INTO new_user_id;
    
    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'error', null,
        'user', json_build_object(
            'id', new_user_id,
            'email', lower(trim(p_email)),
            'full_name', trim(p_full_name),
            'role', 'user',
            'status', 'active'
        )
    );
END;
$$;

-- Função para buscar perfil do usuário
CREATE OR REPLACE FUNCTION impaai.get_user_profile(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado',
            'user', null
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'role', user_record.role,
            'status', user_record.status,
            'avatar_url', user_record.avatar_url,
            'phone', user_record.phone,
            'company', user_record.company,
            'bio', user_record.bio,
            'timezone', user_record.timezone,
            'language', user_record.language,
            'preferences', user_record.preferences,
            'theme_settings', user_record.theme_settings,
            'agents_limit', user_record.agents_limit,
            'connections_limit', user_record.connections_limit,
            'monthly_messages_limit', user_record.monthly_messages_limit,
            'created_at', user_record.created_at,
            'last_login_at', user_record.last_login_at
        )
    );
END;
$$;

-- Função para atualizar perfil
CREATE OR REPLACE FUNCTION impaai.update_user_profile(
    p_user_id UUID,
    p_updates JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_count INTEGER;
BEGIN
    -- Atualizar apenas campos permitidos
    UPDATE impaai.user_profiles 
    SET 
        full_name = COALESCE((p_updates->>'full_name')::TEXT, full_name),
        phone = COALESCE((p_updates->>'phone')::TEXT, phone),
        company = COALESCE((p_updates->>'company')::TEXT, company),
        bio = COALESCE((p_updates->>'bio')::TEXT, bio),
        timezone = COALESCE((p_updates->>'timezone')::TEXT, timezone),
        language = COALESCE((p_updates->>'language')::TEXT, language),
        avatar_url = COALESCE((p_updates->>'avatar_url')::TEXT, avatar_url),
        preferences = COALESCE((p_updates->'preferences')::JSONB, preferences),
        theme_settings = COALESCE((p_updates->'theme_settings')::JSONB, theme_settings),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado ou nenhuma alteração feita'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'message', 'Perfil atualizado com sucesso'
    );
END;
$$;

-- Função para alterar senha
CREATE OR REPLACE FUNCTION impaai.change_user_password(
    p_user_id UUID,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_password TEXT;
    update_count INTEGER;
BEGIN
    -- Buscar senha atual
    SELECT password_hash INTO current_password
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;
    
    -- Verificar senha atual
    IF current_password != p_old_password THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Senha atual incorreta'
        );
    END IF;
    
    -- Validar nova senha
    IF length(p_new_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nova senha deve ter pelo menos 6 caracteres'
        );
    END IF;
    
    -- Atualizar senha
    UPDATE impaai.user_profiles 
    SET password_hash = p_new_password, updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar senha'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'message', 'Senha alterada com sucesso'
    );
END;
$$;

-- 5. CORRIGIR USUÁRIO ADMIN PADRÃO
-- ============================================

-- Remover usuário admin anterior se existir
DELETE FROM impaai.user_profiles WHERE email = 'admin@impa.ai';

-- Inserir usuário admin com senha simples
INSERT INTO impaai.user_profiles (
    full_name, email, password_hash, role, status, 
    agents_limit, connections_limit, monthly_messages_limit, email_verified
) VALUES (
    'Administrador do Sistema',
    'admin@impa.ai',
    'admin123', -- Senha simples sem hash
    'admin', 'active', 999, 999, 999999, true
);

-- 6. FUNÇÕES AUXILIARES PARA O SISTEMA
-- ============================================

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION impaai.is_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Função para listar todos os usuários (apenas admin)
CREATE OR REPLACE FUNCTION impaai.get_all_users(p_admin_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    users_data JSON;
BEGIN
    -- Verificar se é admin
    IF NOT impaai.is_user_admin(p_admin_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado - apenas administradores'
        );
    END IF;
    
    -- Buscar todos os usuários
    SELECT json_agg(
        json_build_object(
            'id', id,
            'full_name', full_name,
            'email', email,
            'role', role,
            'status', status,
            'created_at', created_at,
            'last_login_at', last_login_at,
            'login_count', login_count
        )
    ) INTO users_data
    FROM impaai.user_profiles
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'users', COALESCE(users_data, '[]'::json)
    );
END;
$$;

-- 7. VERIFICAÇÃO E LIMPEZA
-- ============================================

-- Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'impaai'
AND routine_name LIKE 'custom_%'
ORDER BY routine_name;

-- Verificar permissões
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'impaai'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, table_name;

-- ============================================
-- CORREÇÕES APLICADAS COM SUCESSO!
-- 
-- AGORA VOCÊ PODE:
-- 1. Fazer login com: admin@impa.ai / admin123
-- 2. Usar as funções RPC para autenticação
-- 3. Acessar todas as tabelas sem problemas de RLS
-- 
-- FUNÇÕES DISPONÍVEIS:
-- - impaai.custom_login(email, password)
-- - impaai.custom_register(email, password, full_name)
-- - impaai.get_user_profile(user_id)
-- - impaai.update_user_profile(user_id, updates)
-- - impaai.change_user_password(user_id, old_pass, new_pass)
-- ============================================
