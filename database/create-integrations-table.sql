-- Criar tabela de integrações se não existir
CREATE TABLE IF NOT EXISTS impaai.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_integrations_type ON impaai.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON impaai.integrations(is_active);

-- Inserir algumas integrações padrão se não existirem
INSERT INTO impaai.integrations (name, type, config, is_active)
SELECT 'Evolution API', 'evolution_api', '{"apiUrl": "", "apiKey": ""}', false
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.integrations WHERE type = 'evolution_api'
);

INSERT INTO impaai.integrations (name, type, config, is_active)
SELECT 'n8n', 'n8n', '{"flowUrl": "", "apiKey": ""}', false
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.integrations WHERE type = 'n8n'
);

-- Comentários para documentação
COMMENT ON TABLE impaai.integrations IS 'Tabela para armazenar configurações de integrações externas';
COMMENT ON COLUMN impaai.integrations.name IS 'Nome da integração';
COMMENT ON COLUMN impaai.integrations.type IS 'Tipo da integração (evolution_api, n8n, etc.)';
COMMENT ON COLUMN impaai.integrations.config IS 'Configurações específicas da integração em formato JSON';
COMMENT ON COLUMN impaai.integrations.is_active IS 'Se a integração está ativa ou não';
