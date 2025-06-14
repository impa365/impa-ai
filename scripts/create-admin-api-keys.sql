-- Adicionar coluna para identificar API Keys de administrador
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS is_admin_key BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para escopo de acesso
ALTER TABLE impaai.user_api_keys 
ADD COLUMN IF NOT EXISTS access_scope TEXT DEFAULT 'user';

-- Comentários para documentação
COMMENT ON COLUMN impaai.user_api_keys.is_admin_key IS 'Indica se é uma API Key de administrador com acesso global';
COMMENT ON COLUMN impaai.user_api_keys.access_scope IS 'Escopo de acesso: user (próprios bots) ou admin (todos os bots)';

-- Atualizar API Keys existentes de administradores
UPDATE impaai.user_api_keys 
SET is_admin_key = TRUE, access_scope = 'admin'
WHERE user_id IN (
    SELECT id FROM impaai.user_profiles WHERE role = 'admin'
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_admin ON impaai.user_api_keys(is_admin_key, access_scope);

-- Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
  AND table_name = 'user_api_keys'
ORDER BY ordinal_position;
