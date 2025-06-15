-- ============================================
-- IMPA AI - CORREÇÃO TABELA API KEYS (4ª ETAPA)
-- Adicionar colunas faltantes na tabela user_api_keys
-- ============================================

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA USER_API_KEYS
-- ============================================

-- Adicionar coluna access_scope
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS access_scope VARCHAR(50) DEFAULT 'user' CHECK (access_scope IN ('user', 'admin', 'system'));

-- Adicionar coluna is_admin_key
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS is_admin_key BOOLEAN DEFAULT false;

-- Adicionar coluna allowed_ips (para segurança adicional)
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS allowed_ips JSONB DEFAULT '[]';

-- Adicionar coluna usage_count (para estatísticas)
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- 2. ATUALIZAR ÍNDICES PARA AS NOVAS COLUNAS
-- ============================================

-- Índice para access_scope
CREATE INDEX IF NOT EXISTS idx_user_api_keys_access_scope 
ON impaai.user_api_keys(access_scope);

-- Índice para is_admin_key
CREATE INDEX IF NOT EXISTS idx_user_api_keys_admin 
ON impaai.user_api_keys(is_admin_key) WHERE is_admin_key = true;

-- 3. ATUALIZAR FUNÇÃO DE CRIAÇÃO DE API KEY
-- ============================================

CREATE OR REPLACE FUNCTION impaai.create_user_api_key(
    p_user_id UUID,
    p_name TEXT,
    p_api_key TEXT,
    p_description TEXT DEFAULT NULL,
    p_permissions JSONB DEFAULT '["read"]',
    p_rate_limit INTEGER DEFAULT 100,
    p_access_scope TEXT DEFAULT 'user',
    p_is_admin_key BOOLEAN DEFAULT false
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
        access_scope,
        is_admin_key
    ) VALUES (
        p_user_id, 
        p_name, 
        p_api_key, 
        COALESCE(p_description, 'API Key para integração'), 
        p_permissions,
        p_rate_limit,
        true,
        p_access_scope,
        p_is_admin_key
    );
END;
$$;

-- 4. FUNÇÃO PARA INCREMENTAR USAGE COUNT
-- ============================================

CREATE OR REPLACE FUNCTION impaai.increment_api_key_usage(p_api_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE impaai.user_api_keys 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE api_key = p_api_key AND is_active = true;
END;
$$;

-- 5. FUNÇÃO MELHORADA PARA BUSCAR API KEY
-- ============================================

CREATE OR REPLACE FUNCTION impaai.get_user_api_key_by_key(p_api_key TEXT)
RETURNS TABLE (
    id UUID, 
    user_id UUID, 
    name TEXT, 
    api_key TEXT, 
    description TEXT, 
    permissions JSONB, 
    rate_limit INTEGER, 
    is_active BOOLEAN, 
    access_scope TEXT,
    is_admin_key BOOLEAN,
    usage_count INTEGER,
    created_at TIMESTAMPTZ, 
    updated_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, u.user_id, u.name, u.api_key, u.description, 
        u.permissions, u.rate_limit, u.is_active, u.access_scope,
        u.is_admin_key, u.usage_count, u.created_at, u.updated_at, u.last_used_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;

-- 6. FUNÇÃO PARA LISTAR API KEYS DE UM USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION impaai.get_user_api_keys(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'api_key', api_key,
            'description', description,
            'permissions', permissions,
            'rate_limit', rate_limit,
            'is_active', is_active,
            'access_scope', access_scope,
            'is_admin_key', is_admin_key,
            'usage_count', usage_count,
            'last_used_at', last_used_at,
            'created_at', created_at
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'api_keys', COALESCE(api_keys_data, '[]'::json)
    );
END;
$$;

-- 7. FUNÇÃO PARA ADMIN LISTAR TODAS AS API KEYS
-- ============================================

CREATE OR REPLACE FUNCTION impaai.get_all_api_keys(p_admin_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    -- Verificar se é admin
    IF NOT impaai.is_user_admin(p_admin_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado - apenas administradores'
        );
    END IF;
    
    -- Buscar todas as API keys com informações do usuário
    SELECT json_agg(
        json_build_object(
            'id', ak.id,
            'name', ak.name,
            'api_key', ak.api_key,
            'description', ak.description,
            'permissions', ak.permissions,
            'rate_limit', ak.rate_limit,
            'is_active', ak.is_active,
            'access_scope', ak.access_scope,
            'is_admin_key', ak.is_admin_key,
            'usage_count', ak.usage_count,
            'last_used_at', ak.last_used_at,
            'created_at', ak.created_at,
            'user', json_build_object(
                'id', up.id,
                'full_name', up.full_name,
                'email', up.email,
                'role', up.role
            )
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys ak
    JOIN impaai.user_profiles up ON ak.user_id = up.id
    ORDER BY ak.created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'api_keys', COALESCE(api_keys_data, '[]'::json)
    );
END;
$$;

-- 8. ATUALIZAR API KEYS EXISTENTES COM VALORES PADRÃO
-- ============================================

-- Atualizar registros existentes com valores padrão
UPDATE impaai.user_api_keys 
SET 
    access_scope = 'user',
    is_admin_key = false,
    usage_count = 0
WHERE access_scope IS NULL OR is_admin_key IS NULL OR usage_count IS NULL;

-- 9. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar estrutura da tabela atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys'
ORDER BY ordinal_position;

-- Verificar se existem API keys
SELECT 
    COUNT(*) as total_api_keys,
    COUNT(CASE WHEN is_active THEN 1 END) as active_keys,
    COUNT(CASE WHEN is_admin_key THEN 1 END) as admin_keys
FROM impaai.user_api_keys;

-- ============================================
-- CORREÇÃO APLICADA COM SUCESSO!
-- 
-- NOVAS COLUNAS ADICIONADAS:
-- ✅ access_scope (user/admin/system)
-- ✅ is_admin_key (boolean)
-- ✅ allowed_ips (jsonb para segurança)
-- ✅ usage_count (contador de uso)
-- 
-- FUNÇÕES ATUALIZADAS:
-- ✅ create_user_api_key() - com novos parâmetros
-- ✅ get_user_api_key_by_key() - retorna novos campos
-- ✅ get_user_api_keys() - lista API keys do usuário
-- ✅ get_all_api_keys() - lista todas (admin only)
-- ✅ increment_api_key_usage() - incrementa contador
-- ============================================
