-- Corrigir problemas de chaves duplicadas na tabela system_settings
-- Este script vai limpar dados corrompidos e reorganizar a estrutura

-- Primeiro, vamos verificar a estrutura atual da tabela
DO $$ 
BEGIN
    -- Verificar se a coluna setting_key é realmente a chave primária
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'impaai' 
        AND table_name = 'system_settings' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%setting_key%'
    ) THEN
        -- Se setting_key não é PK, vamos reorganizar
        
        -- Criar uma tabela temporária com a estrutura correta
        CREATE TEMP TABLE system_settings_temp AS
        SELECT DISTINCT ON (setting_key)
            gen_random_uuid() as id,
            setting_key,
            setting_value,
            description,
            category,
            is_public,
            requires_restart,
            created_at,
            updated_at
        FROM impaai.system_settings
        WHERE setting_key IS NOT NULL
        ORDER BY setting_key, updated_at DESC;
        
        -- Limpar a tabela original
        TRUNCATE impaai.system_settings;
        
        -- Recriar a estrutura correta se necessário
        ALTER TABLE impaai.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
        ALTER TABLE impaai.system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_key_key;
        
        -- Garantir que id seja a chave primária
        ALTER TABLE impaai.system_settings ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);
        
        -- Garantir que setting_key seja único
        ALTER TABLE impaai.system_settings ADD CONSTRAINT system_settings_setting_key_unique UNIQUE (setting_key);
        
        -- Inserir dados limpos de volta
        INSERT INTO impaai.system_settings 
        SELECT * FROM system_settings_temp;
        
        -- Limpar tabela temporária
        DROP TABLE system_settings_temp;
        
    END IF;
END $$;

-- Garantir que temos as configurações essenciais
-- Usar JSONB para valores que precisam ser JSON, e text para strings simples
INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
VALUES 
    ('app_version', '"1.0.0"'::jsonb, 'Versão atual da aplicação', 'general', true, false),
    ('app_name', '"Impa AI"'::jsonb, 'Nome da aplicação', 'general', true, false),
    ('default_whatsapp_connections_limit', '2'::jsonb, 'Limite padrão de conexões WhatsApp para novos usuários', 'limits', false, false),
    ('default_agents_limit', '5'::jsonb, 'Limite padrão de agentes IA para novos usuários', 'limits', false, false),
    ('allow_public_registration', 'true'::jsonb, 'Permitir cadastro público de usuários', 'auth', true, false)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();
