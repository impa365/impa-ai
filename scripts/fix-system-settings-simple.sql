-- Script mais simples para corrigir apenas os dados problemáticos
-- sem operações destrutivas

-- Primeiro, vamos verificar o tipo da coluna setting_value
DO $$
DECLARE
    column_type text;
BEGIN
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_schema = 'impaai' 
    AND table_name = 'system_settings' 
    AND column_name = 'setting_value';
    
    RAISE NOTICE 'Tipo da coluna setting_value: %', column_type;
END $$;

-- Atualizar apenas os registros que precisam de correção
-- Garantindo que os valores sejam JSON válidos

-- Corrigir app_version se existir
UPDATE impaai.system_settings 
SET setting_value = '"1.0.0"'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'app_version';

-- Corrigir app_name se existir  
UPDATE impaai.system_settings 
SET setting_value = '"Impa AI"'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'app_name';

-- Corrigir limites se existirem
UPDATE impaai.system_settings 
SET setting_value = '2'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'default_whatsapp_connections_limit';

UPDATE impaai.system_settings 
SET setting_value = '5'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'default_agents_limit';

-- Corrigir configuração de registro
UPDATE impaai.system_settings 
SET setting_value = 'true'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'allow_public_registration';

-- Inserir configurações que não existem
INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
SELECT 'app_version', '"1.0.0"'::jsonb, 'Versão atual da aplicação', 'general', true, false
WHERE NOT EXISTS (SELECT 1 FROM impaai.system_settings WHERE setting_key = 'app_version');

INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
SELECT 'app_name', '"Impa AI"'::jsonb, 'Nome da aplicação', 'general', true, false
WHERE NOT EXISTS (SELECT 1 FROM impaai.system_settings WHERE setting_key = 'app_name');

INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
SELECT 'default_whatsapp_connections_limit', '2'::jsonb, 'Limite padrão de conexões WhatsApp para novos usuários', 'limits', false, false
WHERE NOT EXISTS (SELECT 1 FROM impaai.system_settings WHERE setting_key = 'default_whatsapp_connections_limit');

INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
SELECT 'default_agents_limit', '5'::jsonb, 'Limite padrão de agentes IA para novos usuários', 'limits', false, false
WHERE NOT EXISTS (SELECT 1 FROM impaai.system_settings WHERE setting_key = 'default_agents_limit');

INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
SELECT 'allow_public_registration', 'true'::jsonb, 'Permitir cadastro público de usuários', 'auth', true, false
WHERE NOT EXISTS (SELECT 1 FROM impaai.system_settings WHERE setting_key = 'allow_public_registration');
