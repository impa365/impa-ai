-- Corrigir estrutura da tabela system_themes
-- Adicionar colunas que podem estar faltando

-- Verificar se a tabela system_themes existe, se não, criar
CREATE TABLE IF NOT EXISTS impaai.system_themes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    colors JSONB DEFAULT '{}',
    fonts JSONB DEFAULT '{}',
    borders JSONB DEFAULT '{}',
    custom_css TEXT,
    logo_icon VARCHAR(10) DEFAULT '🤖',
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna logo_icon se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'logo_icon'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN logo_icon VARCHAR(10) DEFAULT '🤖';
        RAISE NOTICE 'Coluna logo_icon adicionada à tabela system_themes';
    ELSE
        RAISE NOTICE 'Coluna logo_icon já existe na tabela system_themes';
    END IF;
END $$;

-- Adicionar outras colunas que podem estar faltando
DO $$
BEGIN
    -- Verificar e adicionar display_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'display_name'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN display_name VARCHAR(255);
        RAISE NOTICE 'Coluna display_name adicionada à tabela system_themes';
    END IF;

    -- Verificar e adicionar description
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada à tabela system_themes';
    END IF;

    -- Verificar e adicionar colors
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'colors'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN colors JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna colors adicionada à tabela system_themes';
    END IF;

    -- Verificar e adicionar fonts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'fonts'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN fonts JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna fonts adicionada à tabela system_themes';
    END IF;

    -- Verificar e adicionar borders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'borders'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN borders JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna borders adicionada à tabela system_themes';
    END IF;

    -- Verificar e adicionar custom_css
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_themes' 
        AND column_name = 'custom_css'
    ) THEN
        ALTER TABLE impaai.system_themes ADD COLUMN custom_css TEXT;
        RAISE NOTICE 'Coluna custom_css adicionada à tabela system_themes';
    END IF;
END $$;

-- Criar índices úteis se não existirem
CREATE INDEX IF NOT EXISTS idx_system_themes_active ON impaai.system_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_system_themes_default ON impaai.system_themes(is_default);
