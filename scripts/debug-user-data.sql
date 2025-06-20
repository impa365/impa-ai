-- Script para verificar dados de usuários no banco
-- Execute este script para entender a estrutura atual

-- Verificar tabela user_profiles
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    status, 
    CASE WHEN password IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status,
    created_at
FROM impaai.user_profiles 
WHERE email ILIKE '%albert%' OR email ILIKE '%admin%'
ORDER BY created_at DESC;

-- Verificar tabela users (se existir)
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    is_active,
    CASE WHEN password_hash IS NOT NULL THEN 'HAS_HASH' ELSE 'NO_HASH' END as password_status,
    created_at
FROM impaai.users 
WHERE email ILIKE '%albert%' OR email ILIKE '%admin%'
ORDER BY created_at DESC;

-- Verificar se há emails duplicados
SELECT 
    email, 
    COUNT(*) as count
FROM impaai.user_profiles 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Criar usuário de teste se não existir
INSERT INTO impaai.user_profiles (
    email, 
    full_name, 
    role, 
    status, 
    password,
    created_at
) 
SELECT 
    'admin@impa.ai',
    'Administrador',
    'admin',
    'active',
    'admin123',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.user_profiles WHERE email = 'admin@impa.ai'
);
