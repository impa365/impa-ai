-- 🔧 INSERIR CONFIGURAÇÕES PADRÃO DO SISTEMA

-- Inserir configurações básicas se não existirem
INSERT INTO impaai.system_settings (key, value, description, is_active)
VALUES 
    ('app_name', 'Impa AI', 'Nome da aplicação', true),
    ('default_whatsapp_connections_limit', '2', 'Limite padrão de conexões WhatsApp por usuário', true),
    ('registration_enabled', 'true', 'Permitir registro de novos usuários', true),
    ('maintenance_mode', 'false', 'Modo de manutenção', true)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verificar se as configurações foram inseridas
SELECT key, value, description, is_active, created_at
FROM impaai.system_settings
ORDER BY key;
