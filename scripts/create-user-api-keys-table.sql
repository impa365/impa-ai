-- Criar tabela user_api_keys se não existir
CREATE TABLE IF NOT EXISTS impaai.user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES impaai.user_profiles(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON impaai.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON impaai.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON impaai.user_api_keys(is_active);

-- Função para gerar API key automaticamente
CREATE OR REPLACE FUNCTION impaai.generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN 'impaai_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION impaai.update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_api_keys_updated_at
    BEFORE UPDATE ON impaai.user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION impaai.update_user_api_keys_updated_at();

-- Inserir uma API key de exemplo para o admin (se existir)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Buscar o primeiro usuário admin
    SELECT id INTO admin_user_id 
    FROM impaai.user_profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- Se encontrou um admin, criar uma API key para ele
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO impaai.user_api_keys (user_id, api_key, name, description)
        VALUES (
            admin_user_id,
            impaai.generate_api_key(),
            'Admin API Key',
            'API Key principal do administrador'
        )
        ON CONFLICT (api_key) DO NOTHING;
    END IF;
END $$;
