-- 🧪 TESTAR QUERIES APÓS CORREÇÕES

-- Testar query que estava falhando
SELECT COUNT(*) as total_settings
FROM impaai.system_settings 
WHERE is_active = true;

-- Testar query de temas
SELECT COUNT(*) as total_themes
FROM impaai.system_themes 
WHERE name = 'current_theme';

-- Testar todas as queries que o app usa
SELECT 
    'system_settings' as tabela,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM impaai.system_settings
UNION ALL
SELECT 
    'system_themes' as tabela,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE name IS NOT NULL) as com_nome
FROM impaai.system_themes;

-- Testar query específica do tema atual
SELECT config 
FROM impaai.system_themes 
WHERE name = 'current_theme';

-- Mostrar todas as configurações ativas
SELECT key, value, description 
FROM impaai.system_settings 
WHERE is_active = true
ORDER BY key;
