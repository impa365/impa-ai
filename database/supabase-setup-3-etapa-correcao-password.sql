-- ============================================
-- IMPA AI - CORREÇÃO COLUNA PASSWORD (3ª ETAPA)
-- Renomear password_hash para password
-- ============================================

-- 1. RENOMEAR COLUNA PASSWORD_HASH PARA PASSWORD
-- ============================================

ALTER TABLE impaai.user_profiles 
RENAME COLUMN password_hash TO password;

-- 2. ATUALIZAR FUNÇÕES RPC PARA USAR A NOVA COLUNA
-- ============================================

-- Função para login customizado (atualizada)
CREATE OR REPLACE FUNCTION impaai.custom_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Buscar usuário por email
    SELECT * INTO user_record
    FROM impaai.user_profiles
    WHERE email = lower(trim(p_email))
    AND status = 'active';
    
    -- Verificar se usuário existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Credenciais inválidas',
            'user', null
        );
    END IF;
    
    -- Verificar senha (comparação direta)
    IF user_record.password != p_password THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Credenciais inválidas',
            'user', null
        );
    END IF;
    
    -- Atualizar último login
    UPDATE impaai.user_profiles 
    SET 
        last_login_at = NOW(),
        login_count = COALESCE(login_count, 0) + 1
    WHERE id = user_record.id;
    
    -- Retornar sucesso com dados do usuário
    RETURN json_build_object(
        'success', true,
        'error', null,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'role', user_record.role,
            'status', user_record.status,
            'avatar_url', user_record.avatar_url,
            'created_at', user_record.created_at
        )
    );
END;
$$;

-- Função para registro customizado (atualizada)
CREATE OR REPLACE FUNCTION impaai.custom_register(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM impaai.user_profiles WHERE email = lower(trim(p_email))) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Este email já está em uso',
            'user', null
        );
    END IF;
    
    -- Validações básicas
    IF length(trim(p_full_name)) < 2 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nome deve ter pelo menos 2 caracteres',
            'user', null
        );
    END IF;
    
    IF length(p_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Senha deve ter pelo menos 6 caracteres',
            'user', null
        );
    END IF;
    
    -- Inserir novo usuário
    INSERT INTO impaai.user_profiles (
        full_name, email, password, role, status, email_verified
    ) VALUES (
        trim(p_full_name),
        lower(trim(p_email)),
        p_password,
        'user',
        'active',
        true
    ) RETURNING id INTO new_user_id;
    
    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'error', null,
        'user', json_build_object(
            'id', new_user_id,
            'email', lower(trim(p_email)),
            'full_name', trim(p_full_name),
            'role', 'user',
            'status', 'active'
        )
    );
END;
$$;

-- Função para alterar senha (atualizada)
CREATE OR REPLACE FUNCTION impaai.change_user_password(
    p_user_id UUID,
    p_old_password TEXT,
    p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_password TEXT;
    update_count INTEGER;
BEGIN
    -- Buscar senha atual
    SELECT password INTO current_password
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;
    
    -- Verificar senha atual
    IF current_password != p_old_password THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Senha atual incorreta'
        );
    END IF;
    
    -- Validar nova senha
    IF length(p_new_password) < 6 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Nova senha deve ter pelo menos 6 caracteres'
        );
    END IF;
    
    -- Atualizar senha
    UPDATE impaai.user_profiles 
    SET password = p_new_password, updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar senha'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'message', 'Senha alterada com sucesso'
    );
END;
$$;

-- 3. ATUALIZAR USUÁRIO ADMIN COM A NOVA ESTRUTURA
-- ============================================

-- Atualizar usuário admin existente
UPDATE impaai.user_profiles 
SET password = 'admin123'
WHERE email = 'admin@impa.ai';

-- Se não existir, criar novamente
INSERT INTO impaai.user_profiles (
    full_name, email, password, role, status, 
    agents_limit, connections_limit, monthly_messages_limit, email_verified
) 
SELECT 
    'Administrador do Sistema',
    'admin@impa.ai',
    'admin123',
    'admin', 'active', 999, 999, 999999, true
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.user_profiles WHERE email = 'admin@impa.ai'
);

-- 4. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se a coluna foi renomeada
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'impaai' 
AND table_name = 'user_profiles'
AND column_name IN ('password', 'password_hash')
ORDER BY column_name;

-- Verificar usuário admin
SELECT 
    id,
    full_name,
    email,
    role,
    status,
    CASE 
        WHEN password = 'admin123' THEN 'Senha correta'
        ELSE 'Senha incorreta'
    END as senha_status
FROM impaai.user_profiles 
WHERE email = 'admin@impa.ai';

-- ============================================
-- CORREÇÃO APLICADA COM SUCESSO!
-- 
-- MUDANÇAS:
-- ✅ Coluna renomeada: password_hash → password
-- ✅ Funções RPC atualizadas
-- ✅ Usuário admin corrigido
-- 
-- CREDENCIAIS DE TESTE:
-- Email: admin@impa.ai
-- Senha: admin123
-- ============================================
