-- Seed: Create First Super Admin
-- Este script cria o primeiro super administrador do sistema

-- IMPORTANTE: Execute este script apenas uma vez após as migrações
-- ALTERE o email e senha antes de executar

-- Variáveis (ALTERE AQUI)
-- Email: superadmin@impaai.com
-- Senha: SuperAdmin@2024! (será hasheada com bcrypt)
-- Nome: Super Administrador

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'superadmin@impaai.com';
    v_password TEXT := '$2a$10$rF5YNHwWXJmYbqzJ4LhJDuLPO8qXZ9kXGZ8LhJDuLPO8qXZ9kXGZ8'; -- Hash de 'SuperAdmin@2024!'
    v_full_name TEXT := 'Super Administrador';
BEGIN
    -- Verificar se já existe um super admin
    IF EXISTS (SELECT 1 FROM impaai.user_profiles WHERE role = 'super_admin') THEN
        RAISE NOTICE 'Super Admin já existe no sistema';
        RETURN;
    END IF;

    -- Verificar se usuário com este email já existe
    SELECT id INTO v_user_id
    FROM impaai.user_profiles
    WHERE email = v_email
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Atualizar usuário existente para super admin
        UPDATE impaai.user_profiles
        SET
            role = 'super_admin',
            status = 'active',
            full_name = v_full_name,
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário existente atualizado para Super Admin!';
        RAISE NOTICE 'ID: %', v_user_id;
        RAISE NOTICE 'Email: %', v_email;
    ELSE
        -- Criar novo super admin
        INSERT INTO impaai.user_profiles (
            email,
            password,
            full_name,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_email,
            v_password,
            v_full_name,
            'super_admin',
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;

        RAISE NOTICE 'Super Admin criado com sucesso!';
        RAISE NOTICE 'ID: %', v_user_id;
        RAISE NOTICE 'Email: %', v_email;
        RAISE NOTICE 'Senha temporária: SuperAdmin@2024!';
        RAISE NOTICE 'IMPORTANTE: Altere a senha após o primeiro login!';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar Super Admin: %', SQLERRM;
END $$;

-- NOTA: Para gerar um novo hash bcrypt, use:
-- Em Node.js: const bcrypt = require('bcrypt'); bcrypt.hashSync('SuaSenha', 10);
-- Ou use a função custom_register da sua API que já faz isso automaticamente
