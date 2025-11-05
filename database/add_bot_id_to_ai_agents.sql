-- =====================================================
-- ADICIONAR COLUNA bot_id À TABELA ai_agents
-- Data: 2025-10-24
-- Descrição: Adiciona a coluna bot_id para vincular agentes aos bots
-- =====================================================

-- 1. Adicionar a coluna bot_id (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'ai_agents' 
        AND column_name = 'bot_id'
    ) THEN
        ALTER TABLE impaai.ai_agents 
        ADD COLUMN bot_id UUID NULL;
        
        RAISE NOTICE 'Coluna bot_id adicionada à tabela ai_agents';
    ELSE
        RAISE NOTICE 'Coluna bot_id já existe na tabela ai_agents';
    END IF;
END $$;

-- 2. Adicionar Foreign Key para a tabela bots (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'impaai' 
        AND table_name = 'ai_agents' 
        AND constraint_name = 'ai_agents_bot_id_fkey'
    ) THEN
        ALTER TABLE impaai.ai_agents
        ADD CONSTRAINT ai_agents_bot_id_fkey 
        FOREIGN KEY (bot_id) 
        REFERENCES impaai.bots(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key ai_agents_bot_id_fkey adicionada';
    ELSE
        RAISE NOTICE 'Foreign key ai_agents_bot_id_fkey já existe';
    END IF;
END $$;

-- 3. Criar índice para melhor performance (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'impaai' 
        AND tablename = 'ai_agents' 
        AND indexname = 'idx_ai_agents_bot_id'
    ) THEN
        CREATE INDEX idx_ai_agents_bot_id 
        ON impaai.ai_agents(bot_id) 
        WHERE bot_id IS NOT NULL;
        
        RAISE NOTICE 'Índice idx_ai_agents_bot_id criado';
    ELSE
        RAISE NOTICE 'Índice idx_ai_agents_bot_id já existe';
    END IF;
END $$;

-- 4. Conceder permissões na coluna nova (garantir que anonkey pode acessar)
GRANT ALL PRIVILEGES ON impaai.ai_agents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO service_role;

-- 5. Verificar a estrutura atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'impaai' 
AND table_name = 'ai_agents'
ORDER BY ordinal_position;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os logs (NOTICE) para confirmar as alterações
-- 3. Verifique a query de verificação no final
-- 4. Teste a criação de agentes na aplicação
-- =====================================================

