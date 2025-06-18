-- Função para buscar usuário por email (fallback se a API REST não funcionar)
CREATE OR REPLACE FUNCTION impaai.get_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  password TEXT,
  role TEXT,
  status TEXT,
  avatar_url TEXT,
  phone TEXT,
  company TEXT,
  bio TEXT,
  timezone TEXT,
  language TEXT,
  api_key TEXT,
  email_verified BOOLEAN,
  preferences JSONB,
  theme_settings JSONB,
  agents_limit INTEGER,
  connections_limit INTEGER,
  monthly_messages_limit INTEGER,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.password,
    up.role,
    up.status,
    up.avatar_url,
    up.phone,
    up.company,
    up.bio,
    up.timezone,
    up.language,
    up.api_key,
    up.email_verified,
    up.preferences,
    up.theme_settings,
    up.agents_limit,
    up.connections_limit,
    up.monthly_messages_limit,
    up.last_login_at,
    up.login_count,
    up.created_at,
    up.updated_at
  FROM impaai.user_profiles up
  WHERE up.email = user_email;
END;
$$;

-- Permitir acesso público à função
GRANT EXECUTE ON FUNCTION impaai.get_user_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION impaai.get_user_by_email(TEXT) TO authenticated;
