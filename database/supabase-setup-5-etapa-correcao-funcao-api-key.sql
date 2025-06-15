-- ============================================
-- IMPA AI - CORREÇÃO FUNÇÃO get_user_api_key_by_key (5ª ETAPA)
-- Corrige erro ao alterar o tipo de retorno da função
-- ============================================

-- 1. REMOVER FUNÇÃO EXISTENTE (SE EXISTIR)
-- ============================================
-- Remove a versão anterior da função para permitir a recriação com nova estrutura de retorno.
DROP FUNCTION IF EXISTS impaai.get_user_api_key_by_key(TEXT);

-- 2. RECRIAR FUNÇÃO COM A ESTRUTURA DE RETORNO CORRETA
-- ============================================
-- Recria a função com as colunas adicionais (access_scope, is_admin_key, usage_count, last_used_at)
-- que foram adicionadas na tabela user_api_keys na etapa anterior.
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
        u.id, 
        u.user_id, 
        u.name, 
        u.api_key, 
        u.description,
        u.permissions, 
        u.rate_limit, 
        u.is_active, 
        u.access_scope,
        u.is_admin_key, 
        u.usage_count, 
        u.created_at, 
        u.updated_at, 
        u.last_used_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;

-- ============================================
-- CORREÇÃO APLICADA!
--
-- A função impaai.get_user_api_key_by_key(TEXT) foi
-- devidamente removida e recriada com a estrutura 
-- de retorno correta, alinhada com as colunas
-- da tabela user_api_keys.
--
-- Execute este script para resolver o erro.
-- ============================================
