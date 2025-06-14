-- Verificar estrutura atual da tabela user_profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Adicionar colunas de limite se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna max_agents se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'user_profiles' 
        AND column_name = 'max_agents'
    ) THEN
        ALTER TABLE impaai.user_profiles ADD COLUMN max_agents INTEGER DEFAULT 5;
        RAISE NOTICE 'Coluna max_agents adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna max_agents já existe';
    END IF;

    -- Adicionar coluna max_whatsapp_connections se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'user_profiles' 
        AND column_name = 'max_whatsapp_connections'
    ) THEN
        ALTER TABLE impaai.user_profiles ADD COLUMN max_whatsapp_connections INTEGER DEFAULT 3;
        RAISE NOTICE 'Coluna max_whatsapp_connections adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna max_whatsapp_connections já existe';
    END IF;

    -- Adicionar coluna max_integrations se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'user_profiles' 
        AND column_name = 'max_integrations'
    ) THEN
        ALTER TABLE impaai.user_profiles ADD COLUMN max_integrations INTEGER DEFAULT 2;
        RAISE NOTICE 'Coluna max_integrations adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna max_integrations já existe';
    END IF;
END $$;

-- Atualizar usuários existentes com limites padrão
UPDATE impaai.user_profiles 
SET 
    max_agents = COALESCE(max_agents, 5),
    max_whatsapp_connections = COALESCE(max_whatsapp_connections, 3),
    max_integrations = COALESCE(max_integrations, 2)
WHERE max_agents IS NULL 
   OR max_whatsapp_connections IS NULL 
   OR max_integrations IS NULL;

-- Verificar resultado final
SELECT id, email, role, max_agents, max_whatsapp_connections, max_integrations
FROM impaai.user_profiles 
ORDER BY created_at DESC
LIMIT 10;
