-- 🔧 CORRIGIR ESTRUTURA DAS TABELAS DEFINITIVAMENTE

-- 1. CORRIGIR SYSTEM_SETTINGS
-- A tabela usa 'setting_key' mas o código espera 'key'
ALTER TABLE impaai.system_settings 
ADD COLUMN IF NOT EXISTS key VARCHAR(255);

-- Copiar dados de setting_key para key se existirem
UPDATE impaai.system_settings 
SET key = setting_key 
WHERE key IS NULL AND setting_key IS NOT NULL;

-- Adicionar constraint unique para key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_settings' 
        AND constraint_name = 'system_settings_key_unique'
    ) THEN
        ALTER TABLE impaai.system_settings 
        ADD CONSTRAINT system_settings_key_unique UNIQUE (key);
    END IF;
END $$;

-- Adicionar coluna 'value' se não existir (o código espera 'value', não 'setting_value')
ALTER TABLE impaai.system_settings 
ADD COLUMN IF NOT EXISTS value TEXT;

-- Copiar dados de setting_value para value
UPDATE impaai.system_settings 
SET value = setting_value::text 
WHERE value IS NULL AND setting_value IS NOT NULL;

-- 2. CORRIGIR SYSTEM_THEMES
-- Adicionar colunas que estão faltando
ALTER TABLE impaai.system_themes 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Tornar display_name nullable temporariamente para inserir dados
ALTER TABLE impaai.system_themes 
ALTER COLUMN display_name DROP NOT NULL;

-- 3. INSERIR DADOS PADRÃO
-- Limpar dados existentes problemáticos
DELETE FROM impaai.system_themes WHERE name = 'current_theme';

-- Inserir configurações do sistema
INSERT INTO impaai.system_settings (setting_key, key, setting_value, value, description, is_active, category)
VALUES 
    ('app_name', 'app_name', '"Impa AI"', 'Impa AI', 'Nome da aplicação', true, 'general'),
    ('default_whatsapp_connections_limit', 'default_whatsapp_connections_limit', '2', '2', 'Limite padrão de conexões WhatsApp', true, 'limits'),
    ('registration_enabled', 'registration_enabled', 'true', 'true', 'Permitir registro de usuários', true, 'auth'),
    ('maintenance_mode', 'maintenance_mode', 'false', 'false', 'Modo de manutenção', true, 'system')
ON CONFLICT (setting_key) DO UPDATE SET
    key = EXCLUDED.key,
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Inserir tema padrão
INSERT INTO impaai.system_themes (name, display_name, description, config, colors, is_default, is_active)
VALUES (
    'current_theme', 
    'Tema Atual', 
    'Configurações do tema atual do sistema',
    '{
        "systemName": "Impa AI",
        "logoIcon": "🤖",
        "primaryColor": "#2563eb",
        "secondaryColor": "#10b981",
        "accentColor": "#8b5cf6"
    }'::jsonb,
    '{
        "primary": "#2563eb",
        "secondary": "#10b981", 
        "background": "#ffffff",
        "surface": "#f8fafc",
        "text": "#1e293b",
        "border": "#e2e8f0",
        "accent": "#8b5cf6"
    }'::jsonb,
    true,
    true
)
ON CONFLICT (name) DO UPDATE SET
    config = EXCLUDED.config,
    colors = EXCLUDED.colors,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. VERIFICAR RESULTADOS
SELECT 'SYSTEM_SETTINGS' as tabela, COUNT(*) as total FROM impaai.system_settings
UNION ALL
SELECT 'SYSTEM_THEMES' as tabela, COUNT(*) as total FROM impaai.system_themes;

-- Mostrar configurações inseridas
SELECT key, value, description, is_active 
FROM impaai.system_settings 
WHERE is_active = true
ORDER BY key;

-- Mostrar tema atual
SELECT name, display_name, config 
FROM impaai.system_themes 
WHERE name = 'current_theme';
