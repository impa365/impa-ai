-- Verificar o constraint atual da tabela ai_agents
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'ai_agents'::regclass 
AND conname LIKE '%trigger_type%';

-- Verificar a estrutura da coluna trigger_type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agents' 
AND column_name = 'trigger_type';
