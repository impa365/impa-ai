-- Script para adicionar suporte a múltiplas APIs (Evolution e Uazapi)
-- na tabela whatsapp_connections

-- 1. Adicionar coluna api_type
ALTER TABLE impaai.whatsapp_connections
ADD COLUMN IF NOT EXISTS api_type VARCHAR(50) NOT NULL DEFAULT 'evolution';

-- 2. Adicionar constraint para validar o tipo de API
ALTER TABLE impaai.whatsapp_connections
ADD CONSTRAINT whatsapp_connections_api_type_check 
CHECK (api_type IN ('evolution', 'uazapi'));

-- 3. Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_api_type 
ON impaai.whatsapp_connections USING btree (api_type) TABLESPACE pg_default;

-- 4. Comentários para documentação
COMMENT ON COLUMN impaai.whatsapp_connections.api_type IS 
'Tipo de API WhatsApp utilizada: evolution (Evolution API) ou uazapi (Uazapi)';

-- 5. Atualizar conexões existentes para usar Evolution API (padrão)
UPDATE impaai.whatsapp_connections 
SET api_type = 'evolution' 
WHERE api_type IS NULL;

