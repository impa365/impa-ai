-- Criar ou corrigir a tabela user_api_keys
CREATE TABLE IF NOT EXISTS impaai.user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT ARRAY['read'],
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    is_admin_key BOOLEAN DEFAULT false,
    access_scope TEXT DEFAULT 'user' CHECK (access_scope IN ('user', 'admin')),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON impaai.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON impaai.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_is_active ON impaai.user_api_keys(is_active);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION impaai.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON impaai.user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON impaai.user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE impaai.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias API keys
DROP POLICY IF EXISTS "Users can view own api keys" ON impaai.user_api_keys;
CREATE POLICY "Users can view own api keys" ON impaai.user_api_keys
    FOR SELECT USING (user_id = auth.uid());

-- Política para usuários criarem suas próprias API keys
DROP POLICY IF EXISTS "Users can create own api keys" ON impaai.user_api_keys;
CREATE POLICY "Users can create own api keys" ON impaai.user_api_keys
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para usuários atualizarem suas próprias API keys
DROP POLICY IF EXISTS "Users can update own api keys" ON impaai.user_api_keys;
CREATE POLICY "Users can update own api keys" ON impaai.user_api_keys
    FOR UPDATE USING (user_id = auth.uid());

-- Política para usuários deletarem suas próprias API keys
DROP POLICY IF EXISTS "Users can delete own api keys" ON impaai.user_api_keys;
CREATE POLICY "Users can delete own api keys" ON impaai.user_api_keys
    FOR DELETE USING (user_id = auth.uid());

-- Política para admins verem todas as API keys
DROP POLICY IF EXISTS "Admins can view all api keys" ON impaai.user_api_keys;
CREATE POLICY "Admins can view all api keys" ON impaai.user_api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM impaai.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys'
ORDER BY ordinal_position;
