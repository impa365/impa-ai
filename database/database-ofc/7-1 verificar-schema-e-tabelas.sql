SET search_path TO impaai;

-- Verificar o schema atual
SELECT current_schema();

-- Verificar todos os schemas disponíveis
SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;

-- Verificar se a tabela ai_agents existe no schema impaai
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE tablename = 'ai_agents';

-- Verificar todas as tabelas no schema impaai
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'impaai'
ORDER BY tablename;

-- Se a tabela existir no schema impaai, verificar suas colunas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'ai_agents'
ORDER BY ordinal_position;
