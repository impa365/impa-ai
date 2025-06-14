-- 🧪 TESTAR TODAS AS QUERIES QUE O APP USA

-- 1. Query que estava falhando (system_settings com is_active)
SELECT COUNT(*) as settings_ativas
FROM impaai.system_settings 
WHERE is_active = true;

-- 2. Query de tema atual
SELECT config 
FROM impaai.system_themes 
WHERE name = 'current_theme';

-- 3. Testar queries específicas do código
-- Query para pegar configuração por key
SELECT value 
FROM impaai.system_settings 
WHERE key = 'app_name' AND is_active = true;

-- Query para pegar todas as configurações ativas
SELECT key, value, description 
FROM impaai.system_settings 
WHERE is_active = true
ORDER BY key;

-- 4. Verificar se as colunas necessárias existem
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name IN ('system_settings', 'system_themes')
AND column_name IN ('key', 'value', 'is_active', 'config', 'name')
ORDER BY table_name, column_name;

-- 5. Testar insert de nova configuração
INSERT INTO impaai.system_settings (setting_key, key, setting_value, value, description, is_active)
VALUES ('test_config', 'test_config', '"test_value"', 'test_value', 'Configuração de teste', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Verificar se foi inserida
SELECT * FROM impaai.system_settings WHERE key = 'test_config';

-- Limpar teste
DELETE FROM impaai.system_settings WHERE key = 'test_config';
