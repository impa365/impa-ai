-- Forçar refresh do schema da tabela whatsapp_connections
-- Isso ajuda o Supabase a reconhecer as novas colunas

-- Verificar se a coluna last_sync existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
  AND table_name = 'whatsapp_connections' 
  AND column_name = 'last_sync';

-- Se a coluna não existir, criar ela
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
          AND table_name = 'whatsapp_connections' 
          AND column_name = 'last_sync'
    ) THEN
        ALTER TABLE impaai.whatsapp_connections 
        ADD COLUMN last_sync TIMESTAMPTZ DEFAULT NOW();
        
        -- Atualizar registros existentes
        UPDATE impaai.whatsapp_connections 
        SET last_sync = updated_at 
        WHERE last_sync IS NULL;
        
        RAISE NOTICE 'Coluna last_sync criada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna last_sync já existe';
    END IF;
END $$;

-- Verificar novamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
  AND table_name = 'whatsapp_connections' 
ORDER BY ordinal_position;

-- Testar uma atualização simples para verificar se funciona
UPDATE impaai.whatsapp_connections 
SET last_sync = NOW() 
WHERE instance_name = 'cliente01';

-- Verificar se a atualização funcionou
SELECT instance_name, last_sync, updated_at 
FROM impaai.whatsapp_connections 
WHERE instance_name = 'cliente01';
