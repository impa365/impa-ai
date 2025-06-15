-- Criar função para inserir API key com a estrutura correta da tabela
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
        user_id,
        name,
        api_key,
        description,
        permissions,
        rate_limit,
        is_active,
        is_admin_key,
        access_scope,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_name,
        p_api_key,
        COALESCE(p_description, 'API Key para integração com sistemas externos'),
        '["read"]'::jsonb,
        100,
        true,
        false,
        'user',
        NOW(),
        NOW()
    );
END;
$$;

-- Função para deletar API key
CREATE OR REPLACE FUNCTION impaai.delete_user_api_key(
    p_api_key_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM impaai.user_api_keys 
    WHERE id = p_api_key_id;
END;
$$;

-- Função para buscar API key por chave
CREATE OR REPLACE FUNCTION impaai.get_user_api_key_by_key(
    p_api_key TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    api_key TEXT,
    description TEXT,
    permissions JSONB,
    rate_limit INTEGER,
    is_active BOOLEAN,
    is_admin_key BOOLEAN,
    access_scope TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.user_id,
        u.name,
        u.api_key,
        u.description,
        u.permissions,
        u.rate_limit,
        u.is_active,
        u.is_admin_key,
        u.access_scope,
        u.created_at,
        u.updated_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION impaai.create_user_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.delete_user_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_user_api_key_by_key TO authenticated;
