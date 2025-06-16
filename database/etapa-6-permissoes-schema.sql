-- =====================================================
-- ETAPA 6: PERMISSÕES COMPLETAS DO SCHEMA IMPAAI
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 INICIANDO ETAPA 6: CONFIGURAÇÃO DE PERMISSÕES SCHEMA IMPAAI...';
END $$;

-- =====================================================
-- 1. VERIFICAÇÃO DE SCHEMAS E TABELAS EXISTENTES
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Verificar se schema impaai existe
    SELECT COUNT(*) INTO table_count
    FROM information_schema.schemata 
    WHERE schema_name = 'impaai';
    
    IF table_count > 0 THEN
        RAISE NOTICE '✅ Schema impaai encontrado';
    ELSE
        RAISE NOTICE '⚠️ Schema impaai não encontrado - execute as etapas 1-5 primeiro';
        RETURN;
    END IF;
    
    -- Verificar tabelas no schema impaai
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'impaai' 
    AND table_name IN ('user_profiles', 'system_settings', 'system_themes', 'ai_agents', 'whatsapp_connections');
    
    RAISE NOTICE '📊 Tabelas principais encontradas no schema impaai: %', table_count;
    
    IF table_count < 5 THEN
        RAISE NOTICE '⚠️ Algumas tabelas principais não foram encontradas - verifique as etapas 1-5';
    END IF;
END $$;

-- =====================================================
-- 2. PERMISSÕES DO SCHEMA IMPAAI
-- =====================================================

-- Conceder permissões no schema impaai
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT USAGE ON SCHEMA impaai TO anon;
GRANT ALL ON SCHEMA impaai TO service_role;

-- Definir search_path para facilitar acesso
ALTER DATABASE postgres SET search_path TO impaai, public;

DO $$
BEGIN
    RAISE NOTICE '✅ Permissões do schema impaai configuradas';
END $$;

-- =====================================================
-- 3. PERMISSÕES GERAIS DAS TABELAS NO SCHEMA IMPAAI
-- =====================================================

-- Conceder permissões em todas as tabelas do schema impaai
GRANT ALL ON ALL TABLES IN SCHEMA impaai TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA impaai TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA impaai TO anon;

-- Conceder permissões em todas as sequências do schema impaai
GRANT ALL ON ALL SEQUENCES IN SCHEMA impaai TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA impaai TO authenticated;

-- Conceder permissões em todas as funções do schema impaai
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA impaai TO authenticated;

-- Definir permissões padrão para objetos futuros no schema impaai
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA impaai GRANT EXECUTE ON FUNCTIONS TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Permissões gerais das tabelas do schema impaai configuradas';
END $$;

-- =====================================================
-- 4. RLS (ROW LEVEL SECURITY) - DESABILITAR COM VERIFICAÇÃO
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verificar e desabilitar RLS para cada tabela no schema impaai
    
    -- impaai.user_profiles
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.user_profiles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.user_profiles';
    END IF;
    
    -- impaai.system_settings
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'system_settings' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.system_settings DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.system_settings';
    END IF;
    
    -- impaai.system_themes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'system_themes' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.system_themes DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.system_themes';
    END IF;
    
    -- impaai.user_api_keys
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_api_keys' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.user_api_keys DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.user_api_keys';
    END IF;
    
    -- impaai.ai_agents
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ai_agents' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.ai_agents DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.ai_agents';
    END IF;
    
    -- impaai.whatsapp_connections
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'whatsapp_connections' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.whatsapp_connections DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.whatsapp_connections';
    END IF;
    
    -- impaai.organizations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations' 
        AND table_schema = 'impaai'
    ) INTO table_exists;
    
    IF table_exists THEN
        ALTER TABLE impaai.organizations DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS desabilitado para impaai.organizations';
    END IF;
    
END $$;

-- =====================================================
-- 5. PERMISSÕES ESPECÍFICAS PARA FUNÇÕES DO SCHEMA IMPAAI
-- =====================================================

DO $$
BEGIN
    -- Função impaai.create_user_api_key
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'create_user_api_key' AND n.nspname = 'impaai'
    ) THEN
        GRANT EXECUTE ON FUNCTION impaai.create_user_api_key(UUID, TEXT, TEXT, TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.create_user_api_key(UUID, TEXT, TEXT, TEXT) TO service_role;
        RAISE NOTICE '✅ Permissões concedidas para impaai.create_user_api_key';
    ELSE
        RAISE NOTICE '⚠️ Função impaai.create_user_api_key não encontrada';
    END IF;

    -- Função impaai.delete_user_api_key
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'delete_user_api_key' AND n.nspname = 'impaai'
    ) THEN
        GRANT EXECUTE ON FUNCTION impaai.delete_user_api_key(UUID) TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.delete_user_api_key(UUID) TO service_role;
        RAISE NOTICE '✅ Permissões concedidas para impaai.delete_user_api_key';
    ELSE
        RAISE NOTICE '⚠️ Função impaai.delete_user_api_key não encontrada';
    END IF;

    -- Função impaai.get_user_api_key_by_key
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'get_user_api_key_by_key' AND n.nspname = 'impaai'
    ) THEN
        GRANT EXECUTE ON FUNCTION impaai.get_user_api_key_by_key(TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.get_user_api_key_by_key(TEXT) TO service_role;
        RAISE NOTICE '✅ Permissões concedidas para impaai.get_user_api_key_by_key';
    ELSE
        RAISE NOTICE '⚠️ Função impaai.get_user_api_key_by_key não encontrada';
    END IF;

    -- Função impaai.get_active_theme
    IF EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'get_active_theme' AND n.nspname = 'impaai'
    ) THEN
        GRANT EXECUTE ON FUNCTION impaai.get_active_theme() TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.get_active_theme() TO service_role;
        GRANT EXECUTE ON FUNCTION impaai.get_active_theme() TO anon;
        RAISE NOTICE '✅ Permissões concedidas para impaai.get_active_theme';
    ELSE
        RAISE NOTICE '⚠️ Função impaai.get_active_theme não encontrada';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL E RESUMO
-- =====================================================

DO $$
DECLARE
    table_count_impaai INTEGER;
    function_count INTEGER;
    settings_count INTEGER;
    themes_count INTEGER;
    users_count INTEGER;
BEGIN
    -- Contar tabelas no schema impaai
    SELECT COUNT(*) INTO table_count_impaai
    FROM information_schema.tables 
    WHERE table_schema = 'impaai';
    
    -- Contar funções no schema impaai
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'impaai';
    
    -- Contar registros nas tabelas principais
    BEGIN
        SELECT COUNT(*) INTO settings_count FROM impaai.system_settings;
    EXCEPTION
        WHEN OTHERS THEN settings_count := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO themes_count FROM impaai.system_themes;
    EXCEPTION
        WHEN OTHERS THEN themes_count := 0;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO users_count FROM impaai.user_profiles;
    EXCEPTION
        WHEN OTHERS THEN users_count := 0;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO FINAL DAS PERMISSÕES:';
    RAISE NOTICE '   - Tabelas no schema impaai: %', table_count_impaai;
    RAISE NOTICE '   - Funções no schema impaai: %', function_count;
    RAISE NOTICE '   - Configurações do sistema: %', settings_count;
    RAISE NOTICE '   - Temas disponíveis: %', themes_count;
    RAISE NOTICE '   - Usuários cadastrados: %', users_count;
    RAISE NOTICE '   - Schema impaai: ✅ CONFIGURADO';
    RAISE NOTICE '   - RLS: ❌ DESABILITADO (para funcionamento inicial)';
    RAISE NOTICE '   - Permissões: ✅ APLICADAS';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ETAPA 6 CONCLUÍDA: PERMISSÕES DO SCHEMA IMPAAI CONFIGURADAS!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Reinicie a aplicação Docker';
    RAISE NOTICE '   2. Teste login com: admin@impa.ai / admin123';
    RAISE NOTICE '   3. Verifique se as páginas carregam sem erros';
    RAISE NOTICE '   4. Teste criação de agentes e API keys';
END $$;
