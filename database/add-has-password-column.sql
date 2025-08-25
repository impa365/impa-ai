-- Script opcional para adicionar coluna has_password 
-- (caso queira usar esse campo para otimizações futuras)

-- Adicionar coluna has_password se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'shared_whatsapp_links' 
        AND column_name = 'has_password'
    ) THEN
        ALTER TABLE impaai.shared_whatsapp_links 
        ADD COLUMN has_password BOOLEAN GENERATED ALWAYS AS (password_hash IS NOT NULL) STORED;
        
        -- Criar índice para consultas rápidas
        CREATE INDEX IF NOT EXISTS idx_shared_links_has_password 
        ON impaai.shared_whatsapp_links(has_password) 
        WHERE has_password = true;
        
        RAISE NOTICE 'Coluna has_password adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna has_password já existe';
    END IF;
END $$; 