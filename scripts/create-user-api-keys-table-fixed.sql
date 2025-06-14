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

-- Criar índices para performance (só se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_api_keys_user_id') THEN
        CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_api_keys_api_key') THEN
        CREATE INDEX idx_user_api_keys_api_key ON user_api_keys(api_key);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_api_keys_is_active') THEN
        CREATE INDEX idx_user_api_keys_is_active ON user_api_keys(is_active);
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can create own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON user_api_keys;

-- Criar políticas RLS
CREATE POLICY "Users can view own api keys" ON user_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own api keys" ON user_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" ON user_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" ON user_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE user_api_keys IS 'Tabela para armazenar API keys dos usuários';
COMMENT ON COLUMN user_api_keys.api_key IS 'Chave de API única para autenticação';
COMMENT ON COLUMN user_api_keys.permissions IS 'Array de permissões (read, write, admin)';
COMMENT ON COLUMN user_api_keys.rate_limit IS 'Limite de requisições por minuto';
COMMENT ON COLUMN user_api_keys.is_admin_key IS 'Indica se é uma API key de administrador';
COMMENT ON COLUMN user_api_keys.access_scope IS 'Escopo de acesso (user ou admin)';

-- Inserir algumas API keys de exemplo para teste (opcional)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar o primeiro usuário admin (se existir)
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email LIKE '%admin%' OR email LIKE '%test%'
    LIMIT 1;
    
    -- Se encontrou um usuário, criar uma API key de exemplo
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO user_api_keys (
            user_id, 
            api_key, 
            name, 
            description, 
            permissions, 
            is_admin_key,
            access_scope
        ) VALUES (
            admin_user_id,
            'impa_' || encode(gen_random_bytes(32), 'hex'),
            'API Key de Teste',
            'Chave de API criada automaticamente para testes',
            ARRAY['read', 'write'],
            true,
            'admin'
        ) ON CONFLICT (api_key) DO NOTHING;
    END IF;
END $$;

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
ORDER BY ordinal_position;
