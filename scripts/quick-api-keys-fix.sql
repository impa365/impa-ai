-- Script rápido e seguro para corrigir problemas básicos

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual da tabela:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Contar registros atuais
SELECT 'Total de registros:' as info, COUNT(*) as count FROM user_api_keys;

-- 3. Corrigir valores NULL básicos (sem conversões complexas)
UPDATE user_api_keys SET access_scope = 'user' WHERE access_scope IS NULL;
UPDATE user_api_keys SET is_active = true WHERE is_active IS NULL;
UPDATE user_api_keys SET is_admin_key = false WHERE is_admin_key IS NULL;
UPDATE user_api_keys SET rate_limit = 100 WHERE rate_limit IS NULL;
UPDATE user_api_keys SET created_at = NOW() WHERE created_at IS NULL;
UPDATE user_api_keys SET updated_at = NOW() WHERE updated_at IS NULL;

-- 4. Corrigir permissions apenas se for NULL (sem conversão de tipo)
UPDATE user_api_keys 
SET permissions = ARRAY['read'] 
WHERE permissions IS NULL;

-- 5. Verificar se ainda há registros problemáticos
SELECT 'Registros com problemas:' as info;
SELECT 
    COUNT(*) as problematic_records
FROM user_api_keys 
WHERE permissions IS NULL 
   OR access_scope IS NULL 
   OR is_active IS NULL 
   OR is_admin_key IS NULL;

-- 6. Mostrar estatísticas finais
SELECT 'Estatísticas finais:' as info;
SELECT 
    COUNT(*) as total_keys,
    COUNT(CASE WHEN is_admin_key = true THEN 1 END) as admin_keys,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_keys,
    COUNT(DISTINCT user_id) as unique_users
FROM user_api_keys;

-- 7. Mostrar alguns registros de exemplo
SELECT 'Exemplos de registros:' as info;
SELECT 
    id,
    LEFT(api_key, 20) || '...' as api_key_preview,
    name,
    permissions,
    access_scope,
    is_active,
    created_at
FROM user_api_keys 
ORDER BY created_at DESC 
LIMIT 3;
