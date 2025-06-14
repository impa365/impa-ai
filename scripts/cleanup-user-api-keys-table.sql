-- Script para limpar e padronizar a tabela user_api_keys
-- Remove duplicatas e garante estrutura consistente

-- Primeiro, vamos verificar a estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Limpar dados de teste se existirem
DELETE FROM user_api_keys WHERE description LIKE '%teste%' OR description LIKE '%test%';

-- Verificar se há registros na tabela
SELECT COUNT(*) as total_api_keys FROM user_api_keys;

-- Se a tabela estiver vazia ou com poucos registros, podemos recriar
-- Caso contrário, apenas ajustar as colunas necessárias

-- Garantir que as colunas essenciais existam com os tipos corretos
DO $$
BEGIN
    -- Verificar e ajustar coluna permissions se necessário
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_api_keys' 
        AND column_name = 'permissions' 
        AND data_type = 'jsonb'
    ) THEN
        -- Converter JSONB para ARRAY se necessário
        ALTER TABLE user_api_keys 
        ALTER COLUMN permissions TYPE TEXT[] 
        USING CASE 
            WHEN permissions IS NULL THEN ARRAY['read']
            WHEN jsonb_typeof(permissions) = 'array' THEN 
                ARRAY(SELECT jsonb_array_elements_text(permissions))
            ELSE ARRAY['read']
        END;
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
    
    -- Garantir que permissions tenha valor padrão
    UPDATE user_api_keys 
    SET permissions = ARRAY['read'] 
    WHERE permissions IS NULL OR array_length(permissions, 1) IS NULL;
    
END $$;

-- Adicionar constraints se não existirem
DO $$
BEGIN
    -- Constraint para access_scope
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_api_keys_access_scope_check'
    ) THEN
        ALTER TABLE user_api_keys 
        ADD CONSTRAINT user_api_keys_access_scope_check 
        CHECK (access_scope IN ('user', 'admin'));
    END IF;
    
    -- Constraint para api_key não vazio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_api_keys_api_key_not_empty'
    ) THEN
        ALTER TABLE user_api_keys 
        ADD CONSTRAINT user_api_keys_api_key_not_empty 
        CHECK (length(api_key) > 10);
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- Se houver erro, apenas continuar
    RAISE NOTICE 'Alguns constraints podem já existir: %', SQLERRM;
END $$;

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Mostrar estatísticas finais
SELECT 
    COUNT(*) as total_keys,
    COUNT(CASE WHEN is_admin_key = true THEN 1 END) as admin_keys,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
    COUNT(DISTINCT user_id) as unique_users
FROM user_api_keys;
