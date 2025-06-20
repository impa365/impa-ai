-- Verificar se a tabela user_api_keys existe e tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'impaai' AND table_name = 'user_api_keys') THEN
        RAISE NOTICE '❌ Tabela user_api_keys não existe. Criando...';
        
        -- Criar a tabela user_api_keys
        CREATE TABLE impaai.user_api_keys (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            api_key VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            permissions JSONB DEFAULT '["read"]'::jsonb,
            rate_limit INTEGER DEFAULT 100,
            is_active BOOLEAN DEFAULT true,
            is_admin_key BOOLEAN DEFAULT false,
            access_scope VARCHAR(20) DEFAULT 'user',
            allowed_ips JSONB DEFAULT '[]'::jsonb,
            usage_count INTEGER DEFAULT 0,
            last_used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Criar índices
        CREATE INDEX idx_user_api_keys_user_id ON impaai.user_api_keys(user_id);
        CREATE INDEX idx_user_api_keys_api_key ON impaai.user_api_keys(api_key);
        CREATE INDEX idx_user_api_keys_is_active ON impaai.user_api_keys(is_active);

        -- Criar trigger para updated_at
        CREATE TRIGGER update_user_api_keys_updated_at
            BEFORE UPDATE ON impaai.user_api_keys
            FOR EACH ROW
            EXECUTE FUNCTION impaai.update_updated_at_column();

        RAISE NOTICE '✅ Tabela user_api_keys criada com sucesso!';
    ELSE
        RAISE NOTICE '✅ Tabela user_api_keys já existe.';
    END IF;

    -- Verificar se as colunas necessárias existem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'impaai' AND table_name = 'user_api_keys' AND column_name = 'permissions') THEN
        ALTER TABLE impaai.user_api_keys ADD COLUMN permissions JSONB DEFAULT '["read"]'::jsonb;
        RAISE NOTICE '✅ Coluna permissions adicionada.';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'impaai' AND table_name = 'user_api_keys' AND column_name = 'rate_limit') THEN
        ALTER TABLE impaai.user_api_keys ADD COLUMN rate_limit INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Coluna rate_limit adicionada.';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'impaai' AND table_name = 'user_api_keys' AND column_name = 'access_scope') THEN
        ALTER TABLE impaai.user_api_keys ADD COLUMN access_scope VARCHAR(20) DEFAULT 'user';
        RAISE NOTICE '✅ Coluna access_scope adicionada.';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'impaai' AND table_name = 'user_api_keys' AND column_name = 'allowed_ips') THEN
        ALTER TABLE impaai.user_api_keys ADD COLUMN allowed_ips JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Coluna allowed_ips adicionada.';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'impaai' AND table_name = 'user_api_keys' AND column_name = 'usage_count') THEN
        ALTER TABLE impaai.user_api_keys ADD COLUMN usage_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Coluna usage_count adicionada.';
    END IF;

    -- Habilitar RLS
    ALTER TABLE impaai.user_api_keys ENABLE ROW LEVEL SECURITY;

    -- Criar política para admins verem todas as API keys
    DROP POLICY IF EXISTS "Admins can manage all API keys" ON impaai.user_api_keys;
    CREATE POLICY "Admins can manage all API keys" ON impaai.user_api_keys
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM impaai.user_profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

    -- Criar política para usuários verem apenas suas próprias API keys
    DROP POLICY IF EXISTS "Users can manage their own API keys" ON impaai.user_api_keys;
    CREATE POLICY "Users can manage their own API keys" ON impaai.user_api_keys
        FOR ALL USING (user_id = auth.uid());

    RAISE NOTICE '✅ Políticas RLS configuradas para user_api_keys.';

END $$;

-- Verificar a estrutura final da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' AND table_name = 'user_api_keys'
ORDER BY ordinal_position;
