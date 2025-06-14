-- Criar tabela user_api_keys se não existir
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT ARRAY['read'],
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    is_admin_key BOOLEAN DEFAULT false,
    access_scope TEXT DEFAULT 'user' CHECK (access_scope IN ('user', 'admin')),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_is_active ON user_api_keys(is_active);

-- Habilitar RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias API keys
CREATE POLICY IF NOT EXISTS "Users can view own api keys" ON user_api_keys
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias API keys
CREATE POLICY IF NOT EXISTS "Users can create own api keys" ON user_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias API keys
CREATE POLICY IF NOT EXISTS "Users can update own api keys" ON user_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias API keys
CREATE POLICY IF NOT EXISTS "Users can delete own api keys" ON user_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE user_api_keys IS 'Tabela para armazenar API keys dos usuários';
COMMENT ON COLUMN user_api_keys.api_key IS 'Chave de API única para autenticação';
COMMENT ON COLUMN user_api_keys.permissions IS 'Array de permissões (read, write, admin)';
COMMENT ON COLUMN user_api_keys.rate_limit IS 'Limite de requisições por minuto';
COMMENT ON COLUMN user_api_keys.is_admin_key IS 'Indica se é uma API key de administrador';
COMMENT ON COLUMN user_api_keys.access_scope IS 'Escopo de acesso (user ou admin)';
