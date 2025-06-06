-- Criar tabela de integrações no schema impaai
CREATE TABLE IF NOT EXISTS impaai.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL UNIQUE,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_integrations_type ON impaai.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON impaai.integrations(is_active);

-- Inserir integrações padrão se não existirem
INSERT INTO impaai.integrations (name, type, config, is_active) 
VALUES 
    ('Evolution API', 'evolution_api', '{}', false),
    ('n8n Automation', 'n8n', '{}', false)
ON CONFLICT (type) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE impaai.integrations IS 'Tabela para armazenar configurações de integrações externas';
COMMENT ON COLUMN impaai.integrations.type IS 'Tipo único da integração (evolution_api, n8n, etc.)';
COMMENT ON COLUMN impaai.integrations.config IS 'Configurações específicas da integração em formato JSON';
