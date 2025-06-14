-- ============================================
-- CORRIGIR COLUNAS FALTANTES
-- ============================================
-- Adicionar colunas que o código espera mas não existem
-- ============================================

-- 1. Adicionar coluna logo_icon na tabela system_themes
ALTER TABLE impaai.system_themes 
ADD COLUMN IF NOT EXISTS logo_icon VARCHAR(10) DEFAULT '🤖';

-- 2. Atualizar os temas existentes com logo_icon
UPDATE impaai.system_themes 
SET logo_icon = CASE 
    WHEN name = 'light' THEN '☀️'
    WHEN name = 'dark' THEN '🌙'
    WHEN name = 'blue' THEN '💙'
    ELSE '🤖'
END;

-- 3. Verificar se a configuração current_theme existe e está correta
UPDATE impaai.system_settings 
SET value = '"light"'
WHERE key = 'current_theme';

-- Se não existir, criar
INSERT INTO impaai.system_settings (key, value, category, description, is_public, is_active)
VALUES ('current_theme', '"light"', 'theme', 'Tema atual do sistema', true, true)
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    is_public = true,
    is_active = true;

-- 4. Verificar estrutura da tabela system_themes
SELECT 
    'Estrutura system_themes:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'system_themes'
ORDER BY ordinal_position;

-- 5. Verificar dados dos temas
SELECT 
    'Temas disponíveis:' as info,
    name,
    display_name,
    logo_icon,
    is_active
FROM impaai.system_themes
ORDER BY name;

-- 6. Verificar configuração current_theme
SELECT 
    'Configuração current_theme:' as info,
    key,
    value,
    is_public,
    is_active
FROM impaai.system_settings 
WHERE key = 'current_theme';

-- ============================================
-- ✅ COLUNAS CORRIGIDAS!
-- 
-- ADICIONADO:
-- - logo_icon na tabela system_themes
-- - Valores padrão para os temas existentes
-- - Verificação da configuração current_theme
-- 
-- AGORA O CÓDIGO DEVE FUNCIONAR!
-- ============================================
