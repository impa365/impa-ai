-- ============================================
-- ETAPA 3: CONSTRAINTS E VALIDAÇÕES
-- Execute após a Etapa 2
-- ============================================

SET search_path TO impaai, public;

-- Limpar dados inválidos antes de criar constraints
UPDATE impaai.ai_agents 
SET trigger_type = 'all' 
WHERE trigger_type IS NULL OR trigger_type NOT IN ('keyword', 'all');

UPDATE impaai.ai_agents 
SET trigger_operator = 'equals' 
WHERE trigger_operator IS NULL OR trigger_operator NOT IN ('equals', 'contains', 'startsWith', 'endsWith', 'regex');

-- Remover constraints existentes se houver
DO $$ 
BEGIN
    -- Remover constraint de trigger_type se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_agents_trigger_type_check' 
        AND table_name = 'ai_agents' 
        AND table_schema = 'impaai'
    ) THEN
        ALTER TABLE impaai.ai_agents DROP CONSTRAINT ai_agents_trigger_type_check;
    END IF;
    
    -- Remover constraint de trigger_operator se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_agents_trigger_operator_check' 
        AND table_name = 'ai_agents' 
        AND table_schema = 'impaai'
    ) THEN
        ALTER TABLE impaai.ai_agents DROP CONSTRAINT ai_agents_trigger_operator_check;
    END IF;
END $$;

-- Criar constraints corretas
ALTER TABLE impaai.ai_agents 
ADD CONSTRAINT ai_agents_trigger_type_check 
CHECK (trigger_type IS NULL OR trigger_type IN ('keyword', 'all'));

ALTER TABLE impaai.ai_agents 
ADD CONSTRAINT ai_agents_trigger_operator_check 
CHECK (trigger_operator IS NULL OR trigger_operator IN ('equals', 'contains', 'startsWith', 'endsWith', 'regex'));

-- Criar índice único parcial para agente padrão por conexão
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_agents_default_per_connection 
ON impaai.ai_agents(whatsapp_connection_id) 
WHERE is_default = true;

-- Verificar constraints criadas
SELECT 
    constraint_name,
    constraint_type,
    constraint_definition
FROM information_schema.check_constraints 
WHERE constraint_schema = 'impaai' 
AND constraint_name LIKE '%ai_agents%'
ORDER BY constraint_name;

SELECT 'ETAPA 3 CONCLUÍDA: Constraints e validações criadas' as status;
