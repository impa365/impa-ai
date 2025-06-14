-- Script simples para corrigir problemas básicos na tabela user_api_keys

-- Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_api_keys' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Corrigir valores NULL nas colunas essenciais
UPDATE user_api_keys SET access_scope = 'user' WHERE access_scope IS NULL;
UPDATE user_api_keys SET is_active = true WHERE is_active IS NULL;
UPDATE user_api_keys SET is_admin_key = false WHERE is_admin_key IS NULL;
UPDATE user_api_keys SET rate_limit = 100 WHERE rate_limit IS NULL;
UPDATE user_api_keys SET created_at = NOW() WHERE created_at IS NULL;
UPDATE user_api_keys SET updated_at = NOW() WHERE updated_at IS NULL;

-- Corrigir permissions se for NULL ou vazio
UPDATE user_api_keys 
SET permissions = ARRAY['read'] 
WHERE permissions IS NULL 
   OR (permissions IS NOT NULL AND array_length(permissions, 1) IS NULL);

-- Verificar se há registros problemáticos
SELECT 
    id,
    user_id,
    name,
    permissions,
    access_scope,
    is_active,
    is_admin_key
FROM user_api_keys 
WHERE permissions IS NULL 
   OR access_scope IS NULL 
   OR is_active IS NULL 
   OR is_admin_key IS NULL;

-- Contar registros finais
SELECT COUNT(*) as total_api_keys FROM user_api_keys;

-- Mostrar alguns registros de exemplo
SELECT 
    id,
    LEFT(api_key, 20) || '...' as api_key_preview,
    name,
    permissions,
    access_scope,
    is_active,
    is_admin_key,
    created_at
FROM user_api_keys 
ORDER BY created_at DESC 
LIMIT 5;
