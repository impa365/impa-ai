-- Script para verificar o schema da tabela user_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'impaai' AND table_name = 'user_profiles';
