-- ============================================
-- ETAPA 4: FUNÇÕES E PROCEDURES
-- Execute após a Etapa 3
-- ============================================

SET search_path TO impaai, public;

-- Função para criar API key de usuário
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
        u.created_at,
        u.updated_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;

-- Função para obter tema ativo
CREATE OR REPLACE FUNCTION impaai.get_active_theme()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  theme_data jsonb;
BEGIN
  -- Tentar obter o tema ativo
  SELECT 
    jsonb_build_object(
      'display_name', display_name,
      'description', description,
      'colors', colors,
      'logo_icon', logo_icon,
      'preview_image_url', preview_image_url
    ) INTO theme_data
  FROM impaai.system_themes
  WHERE is_active = true
  LIMIT 1;
  
  -- Se não encontrar, tentar o tema padrão
  IF theme_data IS NULL THEN
    SELECT 
      jsonb_build_object(
        'display_name', display_name,
        'description', description,
        'colors', colors,
        'logo_icon', logo_icon,
        'preview_image_url', preview_image_url
      ) INTO theme_data
    FROM impaai.system_themes
    WHERE is_default = true
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrar, retornar objeto vazio
  IF theme_data IS NULL THEN
    theme_data := '{}'::jsonb;
  END IF;
  
  RETURN theme_data;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION impaai.create_user_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.delete_user_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_user_api_key_by_key TO authenticated;
GRANT EXECUTE ON FUNCTION impaai.get_active_theme TO authenticated;

SELECT 'ETAPA 4 CONCLUÍDA: Funções e procedures criadas' as status;
