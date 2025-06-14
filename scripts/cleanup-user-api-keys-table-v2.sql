-- Script para limpar e padronizar a tabela user_api_keys
-- Versão 2 - Sintaxe corrigida

-- Verificar a estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há registros na tabela
SELECT COUNT(*) as total_api_keys FROM user_api_keys;

-- Limpar dados de teste se existirem
DELETE FROM user_api_keys WHERE description LIKE '%teste%' OR description LIKE '%test%';

-- Script principal para padronizar a coluna permissions
DO $$
DECLARE
    permissions_data_type TEXT;
    col_count INTEGER;
BEGIN
    -- Verificar o tipo atual da coluna permissions
    SELECT data_type INTO permissions_data_type
    FROM information_schema.columns 
    WHERE table_name = 'user_api_keys' 
        AND column_name = 'permissions'
        AND table_schema = 'public'
    LIMIT 1;
    
    RAISE NOTICE 'Tipo atual da coluna permissions: %', permissions_data_type;
    
    -- Se for JSONB, converter para TEXT[]
    IF permissions_data_type = 'jsonb' THEN
        RAISE NOTICE 'Convertendo permissions de JSONB para TEXT[]...';
        
        ALTER TABLE user_api_keys 
        ALTER COLUMN permissions TYPE TEXT[] 
        USING CASE 
            WHEN permissions IS NULL THEN ARRAY['read']
            WHEN jsonb_typeof(permissions) = 'array' THEN 
                ARRAY(SELECT jsonb_array_elements_text(permissions))
            ELSE ARRAY['read']
        END;
        
    -- Se for ARRAY, apenas garantir valores padrão
    ELSIF permissions_data_type = 'ARRAY' THEN
        RAISE NOTICE 'Coluna permissions já é ARRAY, apenas padronizando valores...';
        
        -- Garantir que permissions tenha valor padrão
        UPDATE user_api_keys 
        SET permissions = ARRAY['read'] 
        WHERE permissions IS NULL OR array_length(permissions, 1) IS NULL;
        
    -- Se for outro tipo, converter diretamente
    ELSE
        RAISE NOTICE 'Convertendo permissions de % para TEXT[]...', permissions_data_type;
        
        ALTER TABLE user_api_keys 
        ALTER COLUMN permissions TYPE TEXT[] 
        USING ARRAY['read'];
    END IF;
    
    -- Garantir que access_scope tenha valor padrão
    UPDATE user_api_keys 
    SET access_scope = 'user' 
    WHERE access_scope IS NULL;
    
    -- Garantir que is_active tenha valor padrão
    UPDATE user_api_keys 
    SET is_active = true 
    WHERE is_active IS NULL;
    
    -- Garantir que is_admin_key tenha valor padrão
    UPDATE user_api_keys 
    SET is_admin_key = false 
    WHERE is_admin_key IS NULL;
    
    -- Garantir que rate_limit tenha valor padrão
    UPDATE user_api_keys 
    SET rate_limit = 100 
    WHERE rate_limit IS NULL;
    
    -- Garantir que created_at tenha valor padrão
    UPDATE user_api_keys 
    SET created_at = NOW() 
    WHERE created_at IS NULL;
    
    -- Garantir que updated_at tenha valor padrão
    UPDATE user_api_keys 
    SET updated_at = NOW() 
    WHERE updated_at IS NULL;
    
    -- Verificar se há colunas duplicadas
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'user_api_keys' 
        AND column_name = 'id'
        AND table_schema = 'public';
    
    IF col_count > 1 THEN
        RAISE NOTICE 'Detectadas colunas duplicadas. Isso pode indicar problema na estrutura da tabela.';
        RAISE NOTICE 'Considere recriar a tabela se houver problemas.';
    END IF;
    
    RAISE NOTICE 'Padronização de dados concluída!';
    
END $$;

-- Adicionar constraints se não existirem
DO $$
BEGIN
    -- Constraint para access_scope
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_api_keys_access_scope_check'
            AND table_name = 'user_api_keys'
    ) THEN
        ALTER TABLE user_api_keys 
        ADD CONSTRAINT user_api_keys_access_scope_check 
        CHECK (access_scope IN ('user', 'admin'));
        RAISE NOTICE 'Constraint access_scope adicionada';
    END IF;
    
    -- Constraint para api_key não vazio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_api_keys_api_key_not_empty'
            AND table_name = 'user_api_keys'
    ) THEN
        ALTER TABLE user_api_keys 
        ADD CONSTRAINT user_api_keys_api_key_not_empty 
        CHECK (length(api_key) > 10);
        RAISE NOTICE 'Constraint api_key_not_empty adicionada';
    END IF;
    
    RAISE NOTICE 'Constraints verificadas e adicionadas conforme necessário';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Alguns constraints podem já existir: %', SQLERRM;
END $$;

-- Verificar e corrigir índices
DO $$
BEGIN
    -- Índice para user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_api_keys' 
            AND indexname = 'idx_user_api_keys_user_id'
    ) THEN
        CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
        RAISE NOTICE 'Índice user_id criado';
    END IF;
    
    -- Índice para api_key (único)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_api_keys' 
            AND indexname = 'idx_user_api_keys_api_key_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_user_api_keys_api_key_unique ON user_api_keys(api_key);
        RAISE NOTICE 'Índice único api_key criado';
    END IF;
    
    -- Índice para is_active
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_api_keys' 
            AND indexname = 'idx_user_api_keys_active'
    ) THEN
        CREATE INDEX idx_user_api_keys_active ON user_api_keys(is_active) WHERE is_active = true;
        RAISE NOTICE 'Índice is_active criado';
    END IF;
    
    RAISE NOTICE 'Índices verificados e criados conforme necessário';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Alguns índices podem já existir: %', SQLERRM;
END $$;

-- Verificações finais
DO $$
DECLARE
    total_keys INTEGER;
    admin_keys INTEGER;
    active_keys INTEGER;
    unique_users INTEGER;
BEGIN
    -- Coletar estatísticas
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN is_admin_key = true THEN 1 END),
        COUNT(CASE WHEN is_active = true THEN 1 END),
        COUNT(DISTINCT user_id)
    INTO total_keys, admin_keys, active_keys, unique_users
    FROM user_api_keys;
    
    RAISE NOTICE 'Estatísticas finais:';
    RAISE NOTICE '- Total de chaves: %', total_keys;
    RAISE NOTICE '- Chaves admin: %', admin_keys;
    RAISE NOTICE '- Chaves ativas: %', active_keys;
    RAISE NOTICE '- Usuários únicos: %', unique_users;
    RAISE NOTICE 'Limpeza e padronização da tabela user_api_keys concluída com sucesso!';
END $$;

-- Mostrar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar constraints aplicadas
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public';

-- Mostrar índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_api_keys' 
    AND schemaname = 'public';

-- Mostrar alguns registros de exemplo
SELECT 
    id,
    LEFT(api_key, 20) || '...' as api_key_preview,
    name,
    permissions,
    access_scope,
    is_active,
    is_admin_key,
    created_at
FROM user_api_keys 
ORDER BY created_at DESC 
LIMIT 5;
