-- ============================================
-- VERIFICAÇÃO E CRIAÇÃO DE FUNÇÕES NECESSÁRIAS
-- Execute este script para verificar e criar todas as funções necessárias
-- ============================================

-- 1. VERIFICAR SE AS FUNÇÕES EXISTEM
-- ============================================

-- Verificar funções existentes no schema impaai
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'impaai' 
AND p.proname IN ('create_user_api_key', 'get_user_api_key_by_key', 'custom_login')
ORDER BY p.proname;

-- 2. CRIAR/RECRIAR A FUNÇÃO create_user_api_key
-- ============================================

-- Remover função existente (se houver)
DROP FUNCTION IF EXISTS impaai.create_user_api_key(UUID, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS impaai.create_user_api_key(UUID, TEXT, TEXT, TEXT);

-- Criar a função simplificada para criação de API keys
CREATE OR REPLACE FUNCTION impaai.create_user_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_api_key TEXT,
    p_description TEXT DEFAULT 'API Key para integração'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar se o usuário existe
    IF NOT EXISTS (SELECT 1 FROM impaai.user_profiles WHERE id = p_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;

    -- Verificar se já existe uma API key com o mesmo nome para o usuário
    IF EXISTS (
        SELECT 1 FROM impaai.user_api_keys 
        WHERE user_id = p_user_id AND name = p_name
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe uma API key com este nome para este usuário'
        );
    END IF;

    -- Inserir a nova API key
    INSERT INTO impaai.user_api_keys (
        user_id,
        name,
        api_key,
        description,
        permissions,
        rate_limit,
        is_active,
        access_scope,
        is_admin_key,
        usage_count
    ) VALUES (
        p_user_id,
        p_name,
        p_api_key,
        p_description,
        '["read"]'::jsonb,
        100,
        true,
        'user',
        false,
        0
    );

    RETURN json_build_object(
        'success', true,
        'message', 'API Key criada com sucesso'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM
    );
END;
$$;

-- 3. CRIAR FUNÇÃO PARA LISTAR API KEYS
-- ============================================

CREATE OR REPLACE FUNCTION impaai.get_all_api_keys()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', ak.id,
            'user_id', ak.user_id,
            'name', ak.name,
            'api_key', ak.api_key,
            'description', ak.description,
            'is_active', ak.is_active,
            'last_used_at', ak.last_used_at,
            'created_at', ak.created_at,
            'user_profiles', json_build_object(
                'full_name', up.full_name,
                'email', up.email,
                'role', up.role
            )
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys ak
    LEFT JOIN impaai.user_profiles up ON ak.user_id = up.id
    ORDER BY ak.created_at DESC;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(api_keys_data, '[]'::json)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro ao buscar API keys: ' || SQLERRM
    );
END;
$$;

-- 4. CRIAR FUNÇÃO PARA BUSCAR USUÁRIOS ATIVOS
-- ============================================

CREATE OR REPLACE FUNCTION impaai.get_active_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    users_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'full_name', full_name,
            'email', email,
            'role', role
        )
    ) INTO users_data
    FROM impaai.user_profiles
    WHERE status = 'active'
    ORDER BY full_name ASC;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(users_data, '[]'::json)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro ao buscar usuários: ' || SQLERRM
    );
END;
$$;

-- 5. CONCEDER PERMISSÕES
-- ============================================

-- Conceder permissões para executar as funções
GRANT EXECUTE ON FUNCTION impaai.create_user_api_key(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_all_api_keys() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_active_users() TO anon, authenticated;

-- 6. VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as funções criadas
SELECT 
    'Função criada: ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'impaai' 
AND p.proname IN ('create_user_api_key', 'get_all_api_keys', 'get_active_users')
ORDER BY p.proname;

-- Verificar se a tabela user_api_keys tem as colunas necessárias
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys'
ORDER BY ordinal_position;

-- ============================================
-- SCRIPT DE VERIFICAÇÃO E CRIAÇÃO CONCLUÍDO!
-- 
-- Este script:
-- ✅ Verifica funções existentes
-- ✅ Cria função create_user_api_key simplificada
-- ✅ Cria função get_all_api_keys para listagem
-- ✅ Cria função get_active_users
-- ✅ Concede permissões necessárias
-- ✅ Faz verificação final
-- ============================================
