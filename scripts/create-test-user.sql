-- Script para criar um usuário de teste se não existir
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar quais tabelas existem
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'impaai') 
AND table_name LIKE '%user%';

-- Criar usuário de teste na tabela users (se existir)
INSERT INTO users (
  email, 
  password_hash, 
  full_name, 
  role, 
  is_active, 
  created_at
) 
SELECT 
  'admin@impa.ai',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'Administrador',
  'admin',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@impa.ai'
);

-- Criar usuário de teste na tabela user_profiles (se existir)
INSERT INTO user_profiles (
  email, 
  password_hash, 
  full_name, 
  role, 
  status, 
  created_at
) 
SELECT 
  'admin@impa.ai',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'Administrador',
  'admin',
  'active',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE email = 'admin@impa.ai'
);

-- Verificar se o usuário foi criado
SELECT 'users' as table_name, email, full_name, role, is_active as status FROM users WHERE email = 'admin@impa.ai'
UNION ALL
SELECT 'user_profiles' as table_name, email, full_name, role, status FROM user_profiles WHERE email = 'admin@impa.ai';
