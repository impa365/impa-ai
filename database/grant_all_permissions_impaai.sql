-- =====================================================
-- SCRIPT PARA LIBERAR TODAS AS PERMISSÕES DO SCHEMA IMPAAI PARA ANONKEY
-- Data: 2025-10-24
-- Descrição: Concede TODAS as permissões possíveis para o role anon (anonkey)
-- ATENÇÃO: Este script libera permissões COMPLETAS - use apenas em desenvolvimento/teste
-- =====================================================

-- 1. PERMISSÕES DE SCHEMA
-- Conceder uso do schema para todos os roles (PRIORIDADE: anon)
GRANT ALL PRIVILEGES ON SCHEMA impaai TO anon;
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT USAGE ON SCHEMA impaai TO service_role;

-- 2. PERMISSÕES PARA TODAS AS TABELAS EXISTENTES
-- Conceder TODAS as permissões para tabelas existentes (FULL ACCESS para anon)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA impaai TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA impaai TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON ALL TABLES IN SCHEMA impaai TO service_role;

-- 3. PERMISSÕES PARA TABELAS FUTURAS
-- Garantir que novas tabelas também tenham TODAS as permissões (FULL ACCESS para anon)
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT ALL PRIVILEGES ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO service_role;

-- 4. PERMISSÕES PARA SEQUENCES
-- Conceder TODAS as permissões para sequences existentes (FULL ACCESS para anon)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA impaai TO anon;
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA impaai TO authenticated;
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA impaai TO service_role;

-- 5. PERMISSÕES PARA SEQUENCES FUTURAS
-- Garantir que novas sequences tenham TODAS as permissões (FULL ACCESS para anon)
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT ALL PRIVILEGES ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO service_role;

-- 6. PERMISSÕES PARA FUNCTIONS
-- Conceder execução para todas as funções existentes (FULL ACCESS para anon)
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA impaai TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO service_role;

-- 7. PERMISSÕES PARA FUNCTIONS FUTURAS
-- Garantir que novas funções tenham TODAS as permissões (FULL ACCESS para anon)
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT ALL PRIVILEGES ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO service_role;

-- 8. PERMISSÕES PARA TYPES
-- Conceder TODAS as permissões para tipos específicos existentes (FULL ACCESS para anon)
GRANT ALL PRIVILEGES ON TYPE impaai.tipo_midia TO anon;
GRANT USAGE ON TYPE impaai.tipo_midia TO authenticated;
GRANT USAGE ON TYPE impaai.tipo_midia TO service_role;

-- 9. PERMISSÕES PARA TYPES FUTUROS
-- Garantir que novos tipos tenham TODAS as permissões (FULL ACCESS para anon)
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT ALL PRIVILEGES ON TYPES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE ON TYPES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE ON TYPES TO service_role;

-- 10. DESABILITAR RLS (ROW LEVEL SECURITY)
-- ATENÇÃO: Desabilitando RLS em TODAS as tabelas para acesso total com anonkey
-- Em produção, considere habilitar RLS com políticas adequadas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'impaai'
    LOOP
        EXECUTE 'ALTER TABLE impaai.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'RLS desabilitado para: %', r.tablename;
    END LOOP;
END $$;

-- 11. PERMISSÕES ESPECÍFICAS PARA TABELAS CRÍTICAS
-- Garantir permissões COMPLETAS para tabelas principais (FULL ACCESS para anon)

-- user_profiles
GRANT ALL PRIVILEGES ON impaai.user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_profiles TO service_role;

-- ai_agents
GRANT ALL PRIVILEGES ON impaai.ai_agents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO service_role;

-- whatsapp_connections
GRANT ALL PRIVILEGES ON impaai.whatsapp_connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO service_role;

-- shared_whatsapp_links
GRANT ALL PRIVILEGES ON impaai.shared_whatsapp_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.shared_whatsapp_links TO service_role;

-- conversations
GRANT ALL PRIVILEGES ON impaai.conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.conversations TO service_role;

-- messages
GRANT ALL PRIVILEGES ON impaai.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.messages TO service_role;

-- user_api_keys
GRANT ALL PRIVILEGES ON impaai.user_api_keys TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO service_role;

-- integrations
GRANT ALL PRIVILEGES ON impaai.integrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.integrations TO service_role;

-- system_settings
GRANT ALL PRIVILEGES ON impaai.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_settings TO service_role;

-- system_themes
GRANT ALL PRIVILEGES ON impaai.system_themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_themes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.system_themes TO service_role;

-- activity_logs
GRANT ALL PRIVILEGES ON impaai.activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.activity_logs TO service_role;

-- agent_activity_logs
GRANT ALL PRIVILEGES ON impaai.agent_activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.agent_activity_logs TO service_role;

-- bookings_cal
GRANT ALL PRIVILEGES ON impaai.bookings_cal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bookings_cal TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bookings_cal TO service_role;

-- lead_folow24hs
GRANT ALL PRIVILEGES ON impaai.lead_folow24hs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.lead_folow24hs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.lead_folow24hs TO service_role;

-- folowUp24hs_mensagem
GRANT ALL PRIVILEGES ON impaai."folowUp24hs_mensagem" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai."folowUp24hs_mensagem" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai."folowUp24hs_mensagem" TO service_role;

-- user_quest_progress (nova tabela do sistema de quests)
GRANT ALL PRIVILEGES ON impaai.user_quest_progress TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_quest_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_quest_progress TO service_role;

-- Tabelas opcionais (bots, bot_sessions)
-- Com tratamento de erro - não falha se a tabela não existir
DO $$
BEGIN
    -- bots
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'impaai' AND tablename = 'bots') THEN
        GRANT ALL PRIVILEGES ON impaai.bots TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bots TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bots TO service_role;
        RAISE NOTICE 'Permissões concedidas para: bots';
    ELSE
        RAISE NOTICE 'Tabela bots não existe - pulando';
    END IF;

    -- bot_sessions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'impaai' AND tablename = 'bot_sessions') THEN
        GRANT ALL PRIVILEGES ON impaai.bot_sessions TO anon;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions TO authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.bot_sessions TO service_role;
        RAISE NOTICE 'Permissões concedidas para: bot_sessions';
    ELSE
        RAISE NOTICE 'Tabela bot_sessions não existe - pulando';
    END IF;
END $$;

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
-- ⚠️ INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os resultados das queries de verificação abaixo
-- 3. Teste as operações da aplicação
-- 4. Monitore os logs de segurança
-- =====================================================

-- ⚠️⚠️⚠️ AVISO DE SEGURANÇA CRÍTICO ⚠️⚠️⚠️
-- Este script concede TODAS AS PERMISSÕES (ALL PRIVILEGES) para o role 'anon' (anonkey)
-- Isso significa que QUALQUER pessoa com a anonkey pode:
--   - LER, CRIAR, MODIFICAR e DELETAR todos os dados
--   - EXECUTAR todas as funções
--   - MODIFICAR a estrutura das tabelas
--   - DESABILITAR Row Level Security (RLS)
-- 
-- 🚨 USE ESTE SCRIPT APENAS EM AMBIENTES DE:
--   - Desenvolvimento local
--   - Testes internos
--   - Protótipos
--
-- ❌ NUNCA USE EM PRODUÇÃO sem implementar:
--   - Row Level Security (RLS) com políticas adequadas
--   - Princípio de menor privilégio
--   - Auditoria e monitoramento de acesso
--   - Validação de entrada e sanitização
-- ===================================================== 