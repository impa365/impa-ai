-- =====================================================
-- SCRIPT PARA LIBERAR TODAS AS PERMISSÕES DO SCHEMA IMPAAI
-- Data: $(date)
-- Descrição: Concede todas as permissões necessárias para o schema impaai
-- =====================================================

-- 1. PERMISSÕES DE SCHEMA
-- Conceder uso do schema para todos os roles
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT USAGE ON SCHEMA impaai TO service_role;

-- 2. PERMISSÕES PARA TODAS AS TABELAS EXISTENTES
-- Conceder todas as permissões para tabelas existentes
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA impaai TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA impaai TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA impaai TO service_role;

-- 3. PERMISSÕES PARA TABELAS FUTURAS
-- Garantir que novas tabelas também tenham as permissões
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;

-- 4. PERMISSÕES PARA SEQUENCES
-- Conceder permissões para todas as sequences existentes
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA impaai TO anon;
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA impaai TO authenticated;
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA impaai TO service_role;

-- 5. PERMISSÕES PARA SEQUENCES FUTURAS
-- Garantir que novas sequences também tenham as permissões
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO service_role;

-- 6. PERMISSÕES PARA FUNCTIONS
-- Conceder execução para todas as funções existentes
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO service_role;

-- 7. PERMISSÕES PARA FUNCTIONS FUTURAS
-- Garantir que novas funções também tenham as permissões
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO service_role;

-- 8. PERMISSÕES PARA TYPES
-- Conceder uso para tipos específicos existentes
GRANT USAGE ON TYPE impaai.tipo_midia TO anon;
GRANT USAGE ON TYPE impaai.tipo_midia TO authenticated;
GRANT USAGE ON TYPE impaai.tipo_midia TO service_role;

-- 9. PERMISSÕES PARA TYPES FUTUROS
-- Garantir que novos tipos também tenham as permissões
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE ON TYPES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE ON TYPES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE ON TYPES TO service_role;

-- 10. DESABILITAR RLS TEMPORARIAMENTE (SE NECESSÁRIO)
-- Uncommente as linhas abaixo se precisar desabilitar RLS em todas as tabelas
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'impaai'
--     LOOP
--         EXECUTE 'ALTER TABLE impaai.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
--     END LOOP;
-- END $$;

-- 11. PERMISSÕES ESPECÍFICAS PARA TABELAS CRÍTICAS
-- Garantir permissões específicas para tabelas principais

-- user_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_profiles TO service_role;

-- ai_agents
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO service_role;

-- whatsapp_connections
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO service_role;

-- shared_whatsapp_links
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO service_role;

-- conversations
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.conversations TO service_role;

-- messages
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.messages TO service_role;

-- user_api_keys
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO service_role;

-- integrations
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.integrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.integrations TO service_role;

-- system_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_settings TO service_role;

-- system_themes
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_themes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_themes TO service_role;

-- activity_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.activity_logs TO service_role;

-- agent_activity_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_activity_logs TO service_role;

-- bookings_cal
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bookings_cal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bookings_cal TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bookings_cal TO service_role;

-- lead_folow24hs
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.lead_folow24hs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.lead_folow24hs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.lead_folow24hs TO service_role;

-- folowUp24hs_mensagem
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai."folowUp24hs_mensagem" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai."folowUp24hs_mensagem" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai."folowUp24hs_mensagem" TO service_role;

-- 12. VERIFICAÇÃO DAS PERMISSÕES
-- Query para verificar se as permissões foram aplicadas corretamente
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'impaai'
ORDER BY table_name, grantee, privilege_type;

-- 13. VERIFICAÇÃO DE FUNCTIONS
-- Query para verificar permissões das funções
SELECT 
    routine_schema,
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'impaai'
ORDER BY routine_name, grantee;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os resultados das queries de verificação
-- 3. Teste as operações da aplicação
-- =====================================================

-- NOTA: Este script concede permissões amplas para desenvolvimento/teste
-- Em produção, considere aplicar princípio de menor privilégio 