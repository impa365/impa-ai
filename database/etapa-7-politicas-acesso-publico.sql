-- =====================================================
-- ETAPA 7: POLÍTICAS DE ACESSO PÚBLICO E CORREÇÕES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔓 INICIANDO ETAPA 7: CONFIGURAÇÃO DE POLÍTICAS DE ACESSO PÚBLICO...';
END $$;

-- =====================================================
-- 1. VERIFICAÇÃO DO ESTADO ATUAL DAS TABELAS
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    existing_tables TEXT[];
    table_name TEXT;
BEGIN
    -- Verificar quais tabelas existem no schema impaai
    SELECT array_agg(t.table_name) INTO existing_tables
    FROM information_schema.tables t
    WHERE t.table_schema = 'impaai';
    
    SELECT COUNT(*) INTO table_count FROM unnest(existing_tables) AS t;
    
    RAISE NOTICE '📊 Tabelas encontradas no schema impaai: %', table_count;
    
    -- Listar todas as tabelas encontradas
    IF existing_tables IS NOT NULL THEN
        FOREACH table_name IN ARRAY existing_tables
        LOOP
            RAISE NOTICE '   - %', table_name;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️ Nenhuma tabela encontrada no schema impaai!';
    END IF;
END $$;

-- =====================================================
-- 2. FUNÇÃO AUXILIAR PARA VERIFICAR EXISTÊNCIA DE TABELA
-- =====================================================

CREATE OR REPLACE FUNCTION check_table_exists(p_schema_name TEXT, p_table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = p_schema_name 
        AND table_name = p_table_name
    );
END;
$$;

-- =====================================================
-- 3. DESABILITAR RLS EM TABELAS EXISTENTES
-- =====================================================

DO $$
DECLARE
    sql_cmd TEXT;
BEGIN
    -- system_settings
    IF check_table_exists('impaai', 'system_settings') THEN
        EXECUTE 'ALTER TABLE impaai.system_settings DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para system_settings';
    ELSE
        RAISE NOTICE '⚠️ Tabela system_settings não encontrada';
    END IF;
    
    -- system_themes
    IF check_table_exists('impaai', 'system_themes') THEN
        EXECUTE 'ALTER TABLE impaai.system_themes DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para system_themes';
    ELSE
        RAISE NOTICE '⚠️ Tabela system_themes não encontrada';
    END IF;
    
    -- user_profiles
    IF check_table_exists('impaai', 'user_profiles') THEN
        EXECUTE 'ALTER TABLE impaai.user_profiles DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para user_profiles';
    ELSE
        RAISE NOTICE '⚠️ Tabela user_profiles não encontrada';
    END IF;
    
    -- user_api_keys
    IF check_table_exists('impaai', 'user_api_keys') THEN
        EXECUTE 'ALTER TABLE impaai.user_api_keys DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para user_api_keys';
    ELSE
        RAISE NOTICE '⚠️ Tabela user_api_keys não encontrada';
    END IF;
    
    -- ai_agents
    IF check_table_exists('impaai', 'ai_agents') THEN
        EXECUTE 'ALTER TABLE impaai.ai_agents DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para ai_agents';
    ELSE
        RAISE NOTICE '⚠️ Tabela ai_agents não encontrada';
    END IF;
    
    -- whatsapp_connections
    IF check_table_exists('impaai', 'whatsapp_connections') THEN
        EXECUTE 'ALTER TABLE impaai.whatsapp_connections DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE '✅ RLS desabilitado para whatsapp_connections';
    ELSE
        RAISE NOTICE '⚠️ Tabela whatsapp_connections não encontrada';
    END IF;
END $$;

-- =====================================================
-- 4. REMOVER POLÍTICAS EXISTENTES (SE EXISTIREM)
-- =====================================================

DO $$
BEGIN
    -- Remover políticas apenas se as tabelas existirem
    IF check_table_exists('impaai', 'system_settings') THEN
        DROP POLICY IF EXISTS "Anyone can view system settings" ON impaai.system_settings;
        DROP POLICY IF EXISTS "Public read access" ON impaai.system_settings;
        DROP POLICY IF EXISTS "Allow public read" ON impaai.system_settings;
    END IF;
    
    IF check_table_exists('impaai', 'system_themes') THEN
        DROP POLICY IF EXISTS "Anyone can view system themes" ON impaai.system_themes;
        DROP POLICY IF EXISTS "Public read access" ON impaai.system_themes;
        DROP POLICY IF EXISTS "Allow public read" ON impaai.system_themes;
    END IF;
    
    IF check_table_exists('impaai', 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON impaai.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON impaai.user_profiles;
    END IF;
    
    RAISE NOTICE '✅ Políticas antigas removidas (se existiam)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao remover políticas: %', SQLERRM;
END $$;

-- =====================================================
-- 5. CONCEDER PERMISSÕES APENAS PARA TABELAS EXISTENTES
-- =====================================================

DO $$
BEGIN
    -- system_settings
    IF check_table_exists('impaai', 'system_settings') THEN
        GRANT ALL ON impaai.system_settings TO service_role;
        GRANT SELECT ON impaai.system_settings TO authenticated;
        GRANT SELECT ON impaai.system_settings TO anon;
        RAISE NOTICE '✅ Permissões concedidas para system_settings';
    END IF;
    
    -- system_themes
    IF check_table_exists('impaai', 'system_themes') THEN
        GRANT ALL ON impaai.system_themes TO service_role;
        GRANT SELECT ON impaai.system_themes TO authenticated;
        GRANT SELECT ON impaai.system_themes TO anon;
        RAISE NOTICE '✅ Permissões concedidas para system_themes';
    END IF;
    
    -- user_profiles
    IF check_table_exists('impaai', 'user_profiles') THEN
        GRANT ALL ON impaai.user_profiles TO service_role;
        GRANT SELECT, INSERT, UPDATE ON impaai.user_profiles TO authenticated;
        RAISE NOTICE '✅ Permissões concedidas para user_profiles';
    END IF;
    
    -- user_api_keys
    IF check_table_exists('impaai', 'user_api_keys') THEN
        GRANT ALL ON impaai.user_api_keys TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.user_api_keys TO authenticated;
        RAISE NOTICE '✅ Permissões concedidas para user_api_keys';
    END IF;
    
    -- ai_agents
    IF check_table_exists('impaai', 'ai_agents') THEN
        GRANT ALL ON impaai.ai_agents TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.ai_agents TO authenticated;
        RAISE NOTICE '✅ Permissões concedidas para ai_agents';
    END IF;
    
    -- whatsapp_connections
    IF check_table_exists('impaai', 'whatsapp_connections') THEN
        GRANT ALL ON impaai.whatsapp_connections TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON impaai.whatsapp_connections TO authenticated;
        RAISE NOTICE '✅ Permissões concedidas para whatsapp_connections';
    END IF;
END $$;

-- =====================================================
-- 6. CONFIGURAR SYSTEM_SETTINGS (SE EXISTIR)
-- =====================================================

DO $$
BEGIN
    IF check_table_exists('impaai', 'system_settings') THEN
        -- Inserir configurações básicas
        INSERT INTO impaai.system_settings (setting_key, setting_value, description, category, is_public, requires_restart)
        VALUES 
            ('allow_public_registration', 'false', 'Permitir cadastro público de usuários', 'auth', true, false),
            ('current_theme', '"default"', 'Tema atual do sistema', 'appearance', true, false),
            ('system_name', '"Impa AI"', 'Nome do sistema', 'general', true, false),
            ('default_whatsapp_connections_limit', '2', 'Limite padrão de conexões WhatsApp', 'limits', false, false),
            ('default_agents_limit', '5', 'Limite padrão de agentes IA', 'limits', false, false)
        ON CONFLICT (setting_key) DO UPDATE SET
            updated_at = NOW(),
            is_public = EXCLUDED.is_public;
        
        RAISE NOTICE '✅ Configurações do sistema inseridas/atualizadas';
    ELSE
        RAISE NOTICE '⚠️ Tabela system_settings não existe - configurações não inseridas';
    END IF;
END $$;

-- =====================================================
-- 7. CONFIGURAR SYSTEM_THEMES (SE EXISTIR)
-- =====================================================

DO $$
BEGIN
    IF check_table_exists('impaai', 'system_themes') THEN
        -- Inserir tema padrão
        INSERT INTO impaai.system_themes (
            name, 
            display_name, 
            description, 
            colors, 
            fonts, 
            borders, 
            is_default, 
            is_active,
            logo_icon
        )
        VALUES (
            'default',
            'Impa AI',
            'Tema padrão do sistema Impa AI',
            '{"primary": "#3b82f6", "secondary": "#10b981", "accent": "#8b5cf6"}',
            '{"primary": "Inter, sans-serif"}',
            '{"radius": "0.5rem"}',
            true,
            true,
            '🤖'
        )
        ON CONFLICT (name) DO UPDATE SET
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Tema padrão configurado';
    ELSE
        RAISE NOTICE '⚠️ Tabela system_themes não existe - tema não configurado';
    END IF;
END $$;

-- =====================================================
-- 8. CRIAR FUNÇÕES DE ACESSO PÚBLICO (SE TABELAS EXISTIREM)
-- =====================================================

DO $$
BEGIN
    IF check_table_exists('impaai', 'system_settings') THEN
        -- Função para configurações públicas
        CREATE OR REPLACE FUNCTION impaai.get_public_settings()
        RETURNS TABLE(setting_key TEXT, setting_value JSONB)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT s.setting_key, s.setting_value
            FROM impaai.system_settings s
            WHERE s.is_public = true;
        END;
        $func$;
        
        -- Função para verificar registro público
        CREATE OR REPLACE FUNCTION impaai.is_public_registration_allowed()
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            allowed BOOLEAN := false;
        BEGIN
            SELECT COALESCE((setting_value)::BOOLEAN, false) INTO allowed
            FROM impaai.system_settings
            WHERE setting_key = 'allow_public_registration';
            
            RETURN allowed;
        END;
        $func$;
        
        -- Conceder permissões para as funções
        GRANT EXECUTE ON FUNCTION impaai.get_public_settings() TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.get_public_settings() TO anon;
        GRANT EXECUTE ON FUNCTION impaai.get_public_settings() TO service_role;
        
        GRANT EXECUTE ON FUNCTION impaai.is_public_registration_allowed() TO authenticated;
        GRANT EXECUTE ON FUNCTION impaai.is_public_registration_allowed() TO anon;
        GRANT EXECUTE ON FUNCTION impaai.is_public_registration_allowed() TO service_role;
        
        RAISE NOTICE '✅ Funções de acesso público criadas';
    ELSE
        RAISE NOTICE '⚠️ system_settings não existe - funções não criadas';
    END IF;
END $$;

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    settings_count INTEGER := 0;
    themes_count INTEGER := 0;
    public_settings_count INTEGER := 0;
    existing_tables_count INTEGER;
BEGIN
    -- Contar tabelas existentes
    SELECT COUNT(*) INTO existing_tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'impaai';
    
    -- Contar dados apenas se as tabelas existirem
    IF check_table_exists('impaai', 'system_settings') THEN
        SELECT COUNT(*) INTO settings_count FROM impaai.system_settings;
        SELECT COUNT(*) INTO public_settings_count FROM impaai.system_settings WHERE is_public = true;
    END IF;
    
    IF check_table_exists('impaai', 'system_themes') THEN
        SELECT COUNT(*) INTO themes_count FROM impaai.system_themes;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICAÇÃO FINAL:';
    RAISE NOTICE '   - Tabelas no schema impaai: %', existing_tables_count;
    RAISE NOTICE '   - Configurações do sistema: %', settings_count;
    RAISE NOTICE '   - Temas disponíveis: %', themes_count;
    RAISE NOTICE '   - Configurações públicas: %', public_settings_count;
    RAISE NOTICE '   - RLS: ❌ DESABILITADO (acesso livre)';
    RAISE NOTICE '   - Políticas: ❌ REMOVIDAS (acesso direto)';
    RAISE NOTICE '';
    
    IF existing_tables_count > 0 THEN
        RAISE NOTICE '🎉 ETAPA 7 CONCLUÍDA: ACESSO PÚBLICO CONFIGURADO!';
        RAISE NOTICE '';
        RAISE NOTICE '🔄 REINICIE A APLICAÇÃO AGORA!';
    ELSE
        RAISE NOTICE '⚠️ ATENÇÃO: Poucas tabelas encontradas!';
        RAISE NOTICE '   Execute as Etapas 1-5 primeiro se necessário.';
    END IF;
END $$;

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS check_table_exists(TEXT, TEXT);
