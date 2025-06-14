-- Script para diagnosticar problemas com API Keys
-- Execute este script para verificar o estado atual

-- 1. Verificar se o schema impaai existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'impaai';

-- 2. Verificar se a tabela user_api_keys existe no schema impaai
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys';

-- 3. Se a tabela existir, verificar sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_api_keys'
ORDER BY ordinal_position;

-- 4. Verificar se há dados na tabela (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'impaai' AND table_name = 'user_api_keys'
    ) THEN
        RAISE NOTICE 'Tabela user_api_keys existe. Verificando dados...';
        PERFORM * FROM impaai.user_api_keys LIMIT 1;
        RAISE NOTICE 'Tabela acessível com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela user_api_keys NÃO existe no schema impaai!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao acessar tabela: %', SQLERRM;
END $$;

-- 5. Verificar permissões RLS (Row Level Security)
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'impaai' 
AND tablename = 'user_api_keys';

-- 6. Verificar políticas RLS se existirem
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'impaai' 
AND tablename = 'user_api_keys';

-- 7. Listar todas as tabelas no schema impaai
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'impaai'
ORDER BY table_name;
