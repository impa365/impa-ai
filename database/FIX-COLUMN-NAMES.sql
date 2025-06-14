-- ============================================
-- CORRIGIR NOMES DAS COLUNAS SYSTEM_SETTINGS
-- ============================================
-- O código espera "key" e "value", mas as colunas são "setting_key" e "setting_value"
-- ============================================

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual system_settings:' as info, column_name 
FROM information_schema.columns 
WHERE table_schema = 'impaai' AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- 2. Renomear colunas para o que o código espera
ALTER TABLE impaai.system_settings 
RENAME COLUMN setting_key TO key;

ALTER TABLE impaai.system_settings 
RENAME COLUMN setting_value TO value;

-- 3. Verificar se funcionou
SELECT 'Estrutura corrigida:' as info, column_name 
FROM information_schema.columns 
WHERE table_schema = 'impaai' AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- 4. Testar query que estava falhando
SELECT 'Teste query corrigida:' as info, key, value 
FROM impaai.system_settings 
WHERE key = 'current_theme';

-- ============================================
-- ✅ NOMES DAS COLUNAS CORRIGIDOS!
-- ============================================
