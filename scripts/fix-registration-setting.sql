-- Verificar o valor atual da configuração
SELECT setting_key, setting_value, typeof(setting_value) as value_type 
FROM impaai.system_settings 
WHERE setting_key = 'allow_public_registration';

-- Atualizar para garantir que o valor seja boolean true
UPDATE impaai.system_settings 
SET setting_value = true,
    updated_at = NOW()
WHERE setting_key = 'allow_public_registration';

-- Verificar se a atualização funcionou
SELECT setting_key, setting_value, typeof(setting_value) as value_type 
FROM impaai.system_settings 
WHERE setting_key = 'allow_public_registration';

-- Se a configuração não existir, criar ela
INSERT INTO impaai.system_settings (
    setting_key, 
    setting_value, 
    category, 
    description, 
    is_public, 
    requires_restart,
    created_at,
    updated_at
) 
SELECT 
    'allow_public_registration',
    true,
    'auth',
    'Permitir cadastro público de usuários',
    true,
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM impaai.system_settings 
    WHERE setting_key = 'allow_public_registration'
);
