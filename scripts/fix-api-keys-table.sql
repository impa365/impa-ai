-- Script para corrigir a tabela user_api_keys
-- Verificar se a coluna name existe e criar se necessário

DO $$
BEGIN
    -- Verificar se a coluna name existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'user_api_keys' 
        AND column_name = 'name'
    ) THEN
        -- Adicionar a coluna name se não existir
        ALTER TABLE impaai.user_api_keys 
        ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT 'API Key';
        
        RAISE NOTICE 'Coluna name adicionada à tabela user_api_keys';
    ELSE
        RAISE NOTICE 'Coluna name já existe na tabela user_api_keys';
    END IF;
    
    -- Verificar se a coluna description existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'user_api_keys' 
        AND column_name = 'description'
    ) THEN
        -- Adicionar a coluna description se não existir
        ALTER TABLE impaai.user_api_keys 
        ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Coluna description adicionada à tabela user_api_keys';
    ELSE
        RAISE NOTICE 'Coluna description já existe na tabela user_api_keys';
    END IF;
    
    -- Atualizar registros existentes que possam ter name vazio
    UPDATE impaai.user_api_keys 
    SET name = 'API Key para integração N8N'
    WHERE name IS NULL OR name = '';
    
    RAISE NOTICE 'Registros atualizados com sucesso';
    
END $$;

-- Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys'
ORDER BY ordinal_position;

-- Mostrar registros existentes
SELECT 
    id,
    user_id,
    name,
    description,
    created_at
FROM impaai.user_api_keys
ORDER BY created_at DESC;
