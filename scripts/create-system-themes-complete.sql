-- Criar ou corrigir completamente a tabela system_themes
-- Este script garante que a estrutura esteja 100% correta

-- Remover tabela se existir (cuidado: isso apaga dados existentes)
-- DROP TABLE IF EXISTS impaai.system_themes;

-- Criar tabela system_themes com estrutura completa
CREATE TABLE IF NOT EXISTS impaai.system_themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    description TEXT,
    colors JSONB DEFAULT '{"primary": "#3b82f6", "secondary": "#10b981", "accent": "#8b5cf6"}',
    fonts JSONB DEFAULT '{"primary": "Inter, sans-serif"}',
    borders JSONB DEFAULT '{"radius": "0.5rem"}',
    custom_css TEXT,
    logo_icon VARCHAR(10) DEFAULT '🤖',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forçar adição da coluna logo_icon se não existir
DO $$
BEGIN
    -- Tentar adicionar a coluna logo_icon
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN logo_icon VARCHAR(10) DEFAULT '🤖';
        RAISE NOTICE 'Coluna logo_icon adicionada com sucesso';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna logo_icon já existe';
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao adicionar coluna logo_icon: %', SQLERRM;
    END;
    
    -- Tentar adicionar outras colunas importantes
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN display_name VARCHAR(255);
        RAISE NOTICE 'Coluna display_name adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN colors JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna colors adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN fonts JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna fonts adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN borders JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna borders adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE impaai.system_themes ADD COLUMN custom_css TEXT;
        RAISE NOTICE 'Coluna custom_css adicionada';
    EXCEPTION
        WHEN duplicate_column THEN NULL;
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Inserir tema padrão se não existir
INSERT INTO impaai.system_themes (
    name, 
    display_name, 
    description, 
    colors, 
    fonts, 
    borders, 
    logo_icon,
    is_default, 
    is_active
) VALUES (
    'default_blue',
    'Impa AI',
    'Tema padrão azul da plataforma',
    '{"primary": "#3b82f6", "secondary": "#10b981", "accent": "#8b5cf6"}',
    '{"primary": "Inter, sans-serif"}',
    '{"radius": "0.5rem"}',
    '🤖',
    true,
    true
) ON CONFLICT (name) DO UPDATE SET
    colors = EXCLUDED.colors,
    fonts = EXCLUDED.fonts,
    borders = EXCLUDED.borders,
    logo_icon = EXCLUDED.logo_icon,
    updated_at = NOW();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_system_themes_active ON impaai.system_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_system_themes_default ON impaai.system_themes(is_default);
CREATE INDEX IF NOT EXISTS idx_system_themes_name ON impaai.system_themes(name);

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'system_themes'
ORDER BY ordinal_position;
