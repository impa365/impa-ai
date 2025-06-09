-- Adicionar coluna last_sync que está faltando na tabela whatsapp_connections
ALTER TABLE impaai.whatsapp_connections 
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;

-- Atualizar conexões existentes com timestamp atual
UPDATE impaai.whatsapp_connections 
SET last_sync = NOW() 
WHERE last_sync IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'whatsapp_connections' 
AND column_name = 'last_sync';
