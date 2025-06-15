-- Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'impaai.ai_agents'::regclass
AND conname LIKE '%trigger%';

-- Remover constraints antigas se existirem
ALTER TABLE impaai.ai_agents DROP CONSTRAINT IF EXISTS check_trigger_type;
ALTER TABLE impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_trigger_type_check;
ALTER TABLE impaai.ai_agents DROP CONSTRAINT IF EXISTS check_trigger_operator;
ALTER TABLE impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_trigger_operator_check;

-- Verificar valores atuais na tabela
SELECT DISTINCT trigger_type, trigger_operator 
FROM impaai.ai_agents 
WHERE trigger_type IS NOT NULL OR trigger_operator IS NOT NULL;

-- Limpar valores inválidos se existirem
UPDATE impaai.ai_agents 
SET trigger_type = 'keyword' 
WHERE trigger_type IS NOT NULL AND trigger_type NOT IN ('keyword', 'all');

UPDATE impaai.ai_agents 
SET trigger_operator = 'equals' 
WHERE trigger_operator IS NOT NULL AND trigger_operator NOT IN ('equals', 'contains', 'startsWith', 'endsWith', 'regex');

-- Recriar constraints com nomes específicos
ALTER TABLE impaai.ai_agents 
ADD CONSTRAINT ai_agents_trigger_type_check 
CHECK (trigger_type IS NULL OR trigger_type IN ('keyword', 'all'));

ALTER TABLE impaai.ai_agents 
ADD CONSTRAINT ai_agents_trigger_operator_check 
CHECK (trigger_operator IS NULL OR trigger_operator IN ('equals', 'contains', 'startsWith', 'endsWith', 'regex'));

-- Verificar se as constraints foram criadas corretamente
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'impaai.ai_agents'::regclass
AND (conname LIKE '%trigger%' OR conname LIKE '%operator%');

-- Verificar dados atuais após limpeza
SELECT id, name, trigger_type, trigger_operator, is_default
FROM impaai.ai_agents 
ORDER BY created_at DESC
LIMIT 5;
