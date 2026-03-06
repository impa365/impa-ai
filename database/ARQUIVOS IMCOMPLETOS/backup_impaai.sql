--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5

-- Started on 2025-09-04 01:03:42

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS authenticated_full_access ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS anon_update_counters ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS anon_access_active_links ON impaai.shared_whatsapp_links;
DROP POLICY IF EXISTS "Public read access to system themes" ON impaai.system_themes;
DROP POLICY IF EXISTS "Public read access to system settings" ON impaai.system_settings;
DROP POLICY IF EXISTS "Public read access to integrations" ON impaai.integrations;
DROP POLICY IF EXISTS "Anon full access bookings_cal" ON impaai.bookings_cal;
ALTER TABLE IF EXISTS ONLY impaai.whatsapp_connections DROP CONSTRAINT IF EXISTS whatsapp_connections_user_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_user_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.shared_whatsapp_links DROP CONSTRAINT IF EXISTS shared_whatsapp_links_user_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.shared_whatsapp_links DROP CONSTRAINT IF EXISTS shared_whatsapp_links_connection_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.messages DROP CONSTRAINT IF EXISTS messages_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.lead_folow24hs DROP CONSTRAINT IF EXISTS lead_folow24hs_whatsappconection_fkey;
ALTER TABLE IF EXISTS ONLY impaai."folowUp24hs_mensagem" DROP CONSTRAINT IF EXISTS folowup24hs_mensagem_impaai_whatsapp_conenections_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.conversations DROP CONSTRAINT IF EXISTS conversations_whatsapp_connection_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.conversations DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_whatsapp_connection_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.agent_activity_logs DROP CONSTRAINT IF EXISTS agent_activity_logs_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY impaai.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_agent_id_fkey;
DROP TRIGGER IF EXISTS update_whatsapp_connections_updated_at ON impaai.whatsapp_connections;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON impaai.user_profiles;
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON impaai.user_api_keys;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON impaai.system_settings;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON impaai.conversations;
DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON impaai.ai_agents;
DROP TRIGGER IF EXISTS trigger_update_shared_links_updated_at ON impaai.shared_whatsapp_links;
DROP INDEX IF EXISTS impaai.idx_whatsapp_connections_user_id;
DROP INDEX IF EXISTS impaai.idx_whatsapp_connections_status;
DROP INDEX IF EXISTS impaai.idx_whatsapp_connections_instance;
DROP INDEX IF EXISTS impaai.idx_user_profiles_status;
DROP INDEX IF EXISTS impaai.idx_user_profiles_role;
DROP INDEX IF EXISTS impaai.idx_user_profiles_email;
DROP INDEX IF EXISTS impaai.idx_user_profiles_api_key;
DROP INDEX IF EXISTS impaai.idx_user_api_keys_user_id;
DROP INDEX IF EXISTS impaai.idx_user_api_keys_api_key;
DROP INDEX IF EXISTS impaai.idx_user_api_keys_admin;
DROP INDEX IF EXISTS impaai.idx_user_api_keys_active;
DROP INDEX IF EXISTS impaai.idx_user_api_keys_access_scope;
DROP INDEX IF EXISTS impaai.idx_system_settings_key;
DROP INDEX IF EXISTS impaai.idx_system_settings_category;
DROP INDEX IF EXISTS impaai.idx_shared_links_user_id;
DROP INDEX IF EXISTS impaai.idx_shared_links_token;
DROP INDEX IF EXISTS impaai.idx_shared_links_expires_at;
DROP INDEX IF EXISTS impaai.idx_shared_links_connection_id;
DROP INDEX IF EXISTS impaai.idx_messages_created_at;
DROP INDEX IF EXISTS impaai.idx_messages_conversation_id;
DROP INDEX IF EXISTS impaai.idx_integrations_type;
DROP INDEX IF EXISTS impaai.idx_integrations_active;
DROP INDEX IF EXISTS impaai.idx_conversations_contact_phone;
DROP INDEX IF EXISTS impaai.idx_conversations_agent_id;
DROP INDEX IF EXISTS impaai.idx_ai_agents_whatsapp_connection;
DROP INDEX IF EXISTS impaai.idx_ai_agents_voice_enabled;
DROP INDEX IF EXISTS impaai.idx_ai_agents_user_id;
DROP INDEX IF EXISTS impaai.idx_ai_agents_type;
DROP INDEX IF EXISTS impaai.idx_ai_agents_trigger_type;
DROP INDEX IF EXISTS impaai.idx_ai_agents_status;
DROP INDEX IF EXISTS impaai.idx_ai_agents_orimon_integration;
DROP INDEX IF EXISTS impaai.idx_ai_agents_orimon;
DROP INDEX IF EXISTS impaai.idx_ai_agents_evolution_bot_id;
DROP INDEX IF EXISTS impaai.idx_ai_agents_default_per_connection;
DROP INDEX IF EXISTS impaai.idx_ai_agents_chatnode_integration;
DROP INDEX IF EXISTS impaai.idx_ai_agents_chatnode;
DROP INDEX IF EXISTS impaai.idx_agent_activity_logs_created_at;
DROP INDEX IF EXISTS impaai.idx_agent_activity_logs_agent_id;
DROP INDEX IF EXISTS impaai.idx_activity_logs_user_id;
DROP INDEX IF EXISTS impaai.idx_activity_logs_created_at;
ALTER TABLE IF EXISTS ONLY impaai.whatsapp_connections DROP CONSTRAINT IF EXISTS whatsapp_connections_user_id_instance_name_key;
ALTER TABLE IF EXISTS ONLY impaai.whatsapp_connections DROP CONSTRAINT IF EXISTS whatsapp_connections_pkey;
ALTER TABLE IF EXISTS ONLY impaai.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_pkey;
ALTER TABLE IF EXISTS ONLY impaai.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_key;
ALTER TABLE IF EXISTS ONLY impaai.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_api_key_key;
ALTER TABLE IF EXISTS ONLY impaai.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_pkey;
ALTER TABLE IF EXISTS ONLY impaai.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_api_key_key;
ALTER TABLE IF EXISTS ONLY impaai.shared_whatsapp_links DROP CONSTRAINT IF EXISTS unique_active_token;
ALTER TABLE IF EXISTS ONLY impaai.system_themes DROP CONSTRAINT IF EXISTS system_themes_pkey;
ALTER TABLE IF EXISTS ONLY impaai.system_themes DROP CONSTRAINT IF EXISTS system_themes_name_key;
ALTER TABLE IF EXISTS ONLY impaai.system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_key_key;
ALTER TABLE IF EXISTS ONLY impaai.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY impaai.shared_whatsapp_links DROP CONSTRAINT IF EXISTS shared_whatsapp_links_pkey;
ALTER TABLE IF EXISTS ONLY impaai.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY impaai.lead_folow24hs DROP CONSTRAINT IF EXISTS lead_folow24hs_pkey;
ALTER TABLE IF EXISTS ONLY impaai.integrations DROP CONSTRAINT IF EXISTS integrations_type_key;
ALTER TABLE IF EXISTS ONLY impaai.integrations DROP CONSTRAINT IF EXISTS integrations_pkey;
ALTER TABLE IF EXISTS ONLY impaai."folowUp24hs_mensagem" DROP CONSTRAINT IF EXISTS folowup24hs_mensagem_impaai_pkey;
ALTER TABLE IF EXISTS ONLY impaai.conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS ONLY impaai.bookings_cal DROP CONSTRAINT IF EXISTS bookings_cal_pkey;
ALTER TABLE IF EXISTS ONLY impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_pkey;
ALTER TABLE IF EXISTS ONLY impaai.ai_agents DROP CONSTRAINT IF EXISTS ai_agents_evolution_bot_id_key;
ALTER TABLE IF EXISTS ONLY impaai.agent_activity_logs DROP CONSTRAINT IF EXISTS agent_activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY impaai.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
DROP TABLE IF EXISTS impaai.whatsapp_connections;
DROP TABLE IF EXISTS impaai.user_profiles;
DROP TABLE IF EXISTS impaai.user_api_keys;
DROP TABLE IF EXISTS impaai.system_themes;
DROP TABLE IF EXISTS impaai.system_settings;
DROP TABLE IF EXISTS impaai.shared_whatsapp_links;
DROP TABLE IF EXISTS impaai.messages;
DROP TABLE IF EXISTS impaai.lead_folow24hs;
DROP TABLE IF EXISTS impaai.integrations;
DROP TABLE IF EXISTS impaai."folowUp24hs_mensagem";
DROP TABLE IF EXISTS impaai.conversations;
DROP TABLE IF EXISTS impaai.bookings_cal;
DROP TABLE IF EXISTS impaai.ai_agents;
DROP TABLE IF EXISTS impaai.agent_activity_logs;
DROP TABLE IF EXISTS impaai.activity_logs;
DROP FUNCTION IF EXISTS impaai.update_user_profile(p_user_id uuid, p_updates json);
DROP FUNCTION IF EXISTS impaai.update_updated_at_column();
DROP FUNCTION IF EXISTS impaai.update_shared_links_updated_at();
DROP FUNCTION IF EXISTS impaai.update_connection_sync(connection_id uuid);
DROP FUNCTION IF EXISTS impaai.is_user_admin(p_user_id uuid);
DROP FUNCTION IF EXISTS impaai.is_public_registration_allowed();
DROP FUNCTION IF EXISTS impaai.increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb);
DROP FUNCTION IF EXISTS impaai.increment_api_key_usage(p_api_key text);
DROP FUNCTION IF EXISTS impaai.get_user_profile(p_user_id uuid);
DROP FUNCTION IF EXISTS impaai.get_user_api_keys(p_user_id uuid);
DROP FUNCTION IF EXISTS impaai.get_user_api_key_by_key(p_api_key text);
DROP FUNCTION IF EXISTS impaai.get_public_settings();
DROP FUNCTION IF EXISTS impaai.get_all_users(p_admin_user_id uuid);
DROP FUNCTION IF EXISTS impaai.get_all_api_keys(p_admin_user_id uuid);
DROP FUNCTION IF EXISTS impaai.get_all_api_keys();
DROP FUNCTION IF EXISTS impaai.get_active_users();
DROP FUNCTION IF EXISTS impaai.get_active_theme();
DROP FUNCTION IF EXISTS impaai.generate_secure_token();
DROP FUNCTION IF EXISTS impaai.generate_api_key();
DROP FUNCTION IF EXISTS impaai.custom_register(p_email text, p_password text, p_full_name text);
DROP FUNCTION IF EXISTS impaai.custom_login(p_email text, p_password text);
DROP FUNCTION IF EXISTS impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text);
DROP FUNCTION IF EXISTS impaai.cleanup_expired_shared_links();
DROP FUNCTION IF EXISTS impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text);
DROP TYPE IF EXISTS impaai.tipo_midia;
DROP SCHEMA IF EXISTS impaai;
--
-- TOC entry 58 (class 2615 OID 19478)
-- Name: impaai; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA impaai;


ALTER SCHEMA impaai OWNER TO supabase_admin;

--
-- TOC entry 1439 (class 1247 OID 19583)
-- Name: tipo_midia; Type: TYPE; Schema: impaai; Owner: supabase_admin
--

CREATE TYPE impaai.tipo_midia AS ENUM (
    'text',
    'image',
    'video',
    'audio',
    'document'
);


ALTER TYPE impaai.tipo_midia OWNER TO supabase_admin;

--
-- TOC entry 677 (class 1255 OID 19593)
-- Name: change_user_password(uuid, text, text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) OWNER TO supabase_admin;

--
-- TOC entry 689 (class 1255 OID 20300)
-- Name: cleanup_expired_shared_links(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.cleanup_expired_shared_links() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM impaai.shared_whatsapp_links 
    WHERE expires_at IS NOT NULL 
    AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION impaai.cleanup_expired_shared_links() OWNER TO supabase_admin;

--
-- TOC entry 678 (class 1255 OID 19594)
-- Name: create_user_api_key(uuid, text, text, text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text DEFAULT 'API Key para integração'::text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar se o usuário existe
    IF NOT EXISTS (SELECT 1 FROM impaai.user_profiles WHERE id = p_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;

    -- Verificar se já existe uma API key com o mesmo nome para o usuário
    IF EXISTS (
        SELECT 1 FROM impaai.user_api_keys 
        WHERE user_id = p_user_id AND name = p_name
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe uma API key com este nome para este usuário'
        );
    END IF;

    -- Inserir a nova API key
    INSERT INTO impaai.user_api_keys (
        user_id,
        name,
        api_key,
        description,
        permissions,
        rate_limit,
        is_active,
        access_scope,
        is_admin_key,
        usage_count
    ) VALUES (
        p_user_id,
        p_name,
        p_api_key,
        p_description,
        '["read"]'::jsonb,
        100,
        true,
        'user',
        false,
        0
    );

    RETURN json_build_object(
        'success', true,
        'message', 'API Key criada com sucesso'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) OWNER TO supabase_admin;

--
-- TOC entry 680 (class 1255 OID 19595)
-- Name: custom_login(text, text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.custom_login(p_email text, p_password text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION impaai.custom_login(p_email text, p_password text) OWNER TO supabase_admin;

--
-- TOC entry 681 (class 1255 OID 19596)
-- Name: custom_register(text, text, text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) OWNER TO supabase_admin;

--
-- TOC entry 670 (class 1255 OID 19597)
-- Name: generate_api_key(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.generate_api_key() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 'impaai_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;


ALTER FUNCTION impaai.generate_api_key() OWNER TO supabase_admin;

--
-- TOC entry 690 (class 1255 OID 20301)
-- Name: generate_secure_token(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.generate_secure_token() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Gera um token de 32 caracteres usando caracteres seguros
    RETURN encode(gen_random_bytes(24), 'base64')
           || to_char(extract(epoch from now()), 'FM999999999');
END;
$$;


ALTER FUNCTION impaai.generate_secure_token() OWNER TO supabase_admin;

--
-- TOC entry 674 (class 1255 OID 19598)
-- Name: get_active_theme(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_active_theme() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    theme_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'display_name', display_name,
        'description', description,
        'colors', colors,
        'logo_icon', logo_icon
    ) INTO theme_data
    FROM impaai.system_themes
    WHERE is_active = true
    LIMIT 1;
    
    IF theme_data IS NULL THEN
        SELECT jsonb_build_object(
            'display_name', display_name,
            'description', description,
            'colors', colors,
            'logo_icon', logo_icon
        ) INTO theme_data
        FROM impaai.system_themes
        WHERE is_default = true
        LIMIT 1;
    END IF;
    
    IF theme_data IS NULL THEN
        theme_data := '{"display_name": "Impa AI", "colors": {"primary": "#3b82f6"}, "logo_icon": "🤖"}'::jsonb;
    END IF;
    
    RETURN theme_data;
END;
$$;


ALTER FUNCTION impaai.get_active_theme() OWNER TO supabase_admin;

--
-- TOC entry 675 (class 1255 OID 19599)
-- Name: get_active_users(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_active_users() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    users_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'full_name', full_name,
            'email', email,
            'role', role
        )
    ) INTO users_data
    FROM impaai.user_profiles
    WHERE status = 'active'
    ORDER BY full_name ASC;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(users_data, '[]'::json)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro ao buscar usuários: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION impaai.get_active_users() OWNER TO supabase_admin;

--
-- TOC entry 676 (class 1255 OID 19600)
-- Name: get_all_api_keys(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_all_api_keys() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', ak.id,
            'user_id', ak.user_id,
            'name', ak.name,
            'api_key', ak.api_key,
            'description', ak.description,
            'is_active', ak.is_active,
            'last_used_at', ak.last_used_at,
            'created_at', ak.created_at,
            'user_profiles', json_build_object(
                'full_name', up.full_name,
                'email', up.email,
                'role', up.role
            )
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys ak
    LEFT JOIN impaai.user_profiles up ON ak.user_id = up.id
    ORDER BY ak.created_at DESC;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(api_keys_data, '[]'::json)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'Erro ao buscar API keys: ' || SQLERRM
    );
END;
$$;


ALTER FUNCTION impaai.get_all_api_keys() OWNER TO supabase_admin;

--
-- TOC entry 683 (class 1255 OID 19601)
-- Name: get_all_api_keys(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    -- Verificar se é admin
    IF NOT impaai.is_user_admin(p_admin_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado - apenas administradores'
        );
    END IF;
    
    -- Buscar todas as API keys com informações do usuário
    SELECT json_agg(
        json_build_object(
            'id', ak.id,
            'name', ak.name,
            'api_key', ak.api_key,
            'description', ak.description,
            'permissions', ak.permissions,
            'rate_limit', ak.rate_limit,
            'is_active', ak.is_active,
            'access_scope', ak.access_scope,
            'is_admin_key', ak.is_admin_key,
            'usage_count', ak.usage_count,
            'last_used_at', ak.last_used_at,
            'created_at', ak.created_at,
            'user', json_build_object(
                'id', up.id,
                'full_name', up.full_name,
                'email', up.email,
                'role', up.role
            )
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys ak
    JOIN impaai.user_profiles up ON ak.user_id = up.id
    ORDER BY ak.created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'api_keys', COALESCE(api_keys_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 685 (class 1255 OID 19602)
-- Name: get_all_users(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_all_users(p_admin_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    users_data JSON;
BEGIN
    -- Verificar se é admin
    IF NOT impaai.is_user_admin(p_admin_user_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Acesso negado - apenas administradores'
        );
    END IF;
    
    -- Buscar todos os usuários
    SELECT json_agg(
        json_build_object(
            'id', id,
            'full_name', full_name,
            'email', email,
            'role', role,
            'status', status,
            'created_at', created_at,
            'last_login_at', last_login_at,
            'login_count', login_count
        )
    ) INTO users_data
    FROM impaai.user_profiles
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'users', COALESCE(users_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION impaai.get_all_users(p_admin_user_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 668 (class 1255 OID 19603)
-- Name: get_public_settings(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_public_settings() RETURNS TABLE(setting_key text, setting_value jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        BEGIN
            RETURN QUERY
            SELECT s.setting_key, s.setting_value
            FROM impaai.system_settings s
            WHERE s.is_public = true;
        END;
        $$;


ALTER FUNCTION impaai.get_public_settings() OWNER TO supabase_admin;

--
-- TOC entry 679 (class 1255 OID 19604)
-- Name: get_user_api_key_by_key(text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_user_api_key_by_key(p_api_key text) RETURNS TABLE(id uuid, user_id uuid, name text, api_key text, description text, permissions jsonb, rate_limit integer, is_active boolean, access_scope text, is_admin_key boolean, usage_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, last_used_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id, u.user_id, u.name, u.api_key, u.description, 
        u.permissions, u.rate_limit, u.is_active, u.access_scope,
        u.is_admin_key, u.usage_count, u.created_at, u.updated_at, u.last_used_at
    FROM impaai.user_api_keys u
    WHERE u.api_key = p_api_key AND u.is_active = true;
END;
$$;


ALTER FUNCTION impaai.get_user_api_key_by_key(p_api_key text) OWNER TO supabase_admin;

--
-- TOC entry 686 (class 1255 OID 19605)
-- Name: get_user_api_keys(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_user_api_keys(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    api_keys_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'api_key', api_key,
            'description', description,
            'permissions', permissions,
            'rate_limit', rate_limit,
            'is_active', is_active,
            'access_scope', access_scope,
            'is_admin_key', is_admin_key,
            'usage_count', usage_count,
            'last_used_at', last_used_at,
            'created_at', created_at
        )
    ) INTO api_keys_data
    FROM impaai.user_api_keys
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'api_keys', COALESCE(api_keys_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION impaai.get_user_api_keys(p_user_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 687 (class 1255 OID 19606)
-- Name: get_user_profile(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.get_user_profile(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT * INTO user_record
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado',
            'user', null
        );
    END IF;
    
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
            'phone', user_record.phone,
            'company', user_record.company,
            'bio', user_record.bio,
            'timezone', user_record.timezone,
            'language', user_record.language,
            'preferences', user_record.preferences,
            'theme_settings', user_record.theme_settings,
            'agents_limit', user_record.agents_limit,
            'connections_limit', user_record.connections_limit,
            'monthly_messages_limit', user_record.monthly_messages_limit,
            'created_at', user_record.created_at,
            'last_login_at', user_record.last_login_at
        )
    );
END;
$$;


ALTER FUNCTION impaai.get_user_profile(p_user_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 682 (class 1255 OID 19607)
-- Name: increment_api_key_usage(text); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.increment_api_key_usage(p_api_key text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE impaai.user_api_keys 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE api_key = p_api_key AND is_active = true;
END;
$$;


ALTER FUNCTION impaai.increment_api_key_usage(p_api_key text) OWNER TO supabase_admin;

--
-- TOC entry 691 (class 1255 OID 20764)
-- Name: increment_shared_link_usage(text, integer, jsonb); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.increment_shared_link_usage(link_id text, max_usage_limit integer DEFAULT NULL::integer, access_log jsonb DEFAULT NULL::jsonb) RETURNS TABLE(success boolean, current_uses integer, error_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  current_usage INTEGER;
  new_usage INTEGER;
  existing_logs JSONB;
  updated_logs JSONB;
BEGIN
  -- Usar SELECT FOR UPDATE para garantir atomicidade
  SELECT 
    COALESCE(s.current_uses, 0),
    COALESCE(s.access_logs, '[]'::jsonb)
  INTO 
    current_usage,
    existing_logs
  FROM impaai.shared_whatsapp_links AS s
  WHERE s.id = link_id 
    AND s.is_active = true
  FOR UPDATE;

  -- Verificar se o link existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Link não encontrado ou inativo'::text;
    RETURN;
  END IF;

  -- Verificar limite ANTES de incrementar
  IF max_usage_limit IS NOT NULL AND current_usage >= max_usage_limit THEN
    RETURN QUERY SELECT false, current_usage, 'Limite de usos atingido'::text;
    RETURN;
  END IF;

  -- Calcular novo uso
  new_usage := current_usage + 1;

  -- Preparar logs atualizados
  IF access_log IS NOT NULL THEN
    updated_logs := existing_logs || jsonb_build_array(access_log);
  ELSE
    updated_logs := existing_logs;
  END IF;

  -- Atualizar atomicamente
  UPDATE impaai.shared_whatsapp_links 
  SET 
    current_uses = new_usage,
    last_accessed_at = NOW(),
    last_accessed_ip = COALESCE((access_log->>'ip')::text, last_accessed_ip),
    access_logs = updated_logs,
    updated_at = NOW()
  WHERE id = link_id;

  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, current_usage, 'Erro ao atualizar contador'::text;
    RETURN;
  END IF;

  -- Retornar sucesso
  RETURN QUERY SELECT true, new_usage, NULL::text;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar falha
    RETURN QUERY SELECT false, current_usage, SQLERRM::text;
END;
$$;


ALTER FUNCTION impaai.increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb) OWNER TO supabase_admin;

--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 691
-- Name: FUNCTION increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb); Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON FUNCTION impaai.increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb) IS 'Incrementa atomicamente o contador de uso de links compartilhados, verificando limites e registrando logs de acesso. Evita race conditions usando SELECT FOR UPDATE.';


--
-- TOC entry 672 (class 1255 OID 19608)
-- Name: is_public_registration_allowed(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.is_public_registration_allowed() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
        DECLARE
            allowed BOOLEAN := false;
        BEGIN
            SELECT COALESCE((setting_value)::BOOLEAN, false) INTO allowed
            FROM impaai.system_settings
            WHERE setting_key = 'allow_public_registration';
            
            RETURN allowed;
        END;
        $$;


ALTER FUNCTION impaai.is_public_registration_allowed() OWNER TO supabase_admin;

--
-- TOC entry 673 (class 1255 OID 19609)
-- Name: is_user_admin(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.is_user_admin(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM impaai.user_profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(user_role = 'admin', false);
END;
$$;


ALTER FUNCTION impaai.is_user_admin(p_user_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 684 (class 1255 OID 19610)
-- Name: update_connection_sync(uuid); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.update_connection_sync(connection_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    UPDATE impaai.whatsapp_connections 
    SET updated_at = current_time
    WHERE id = connection_id;
    
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'updated', true,
            'timestamp', current_time
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Connection not found'
        );
    END IF;
    
    RETURN result;
END;
$$;


ALTER FUNCTION impaai.update_connection_sync(connection_id uuid) OWNER TO supabase_admin;

--
-- TOC entry 671 (class 1255 OID 20298)
-- Name: update_shared_links_updated_at(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.update_shared_links_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION impaai.update_shared_links_updated_at() OWNER TO supabase_admin;

--
-- TOC entry 669 (class 1255 OID 19611)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION impaai.update_updated_at_column() OWNER TO supabase_admin;

--
-- TOC entry 688 (class 1255 OID 19612)
-- Name: update_user_profile(uuid, json); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    update_count INTEGER;
BEGIN
    -- Atualizar apenas campos permitidos
    UPDATE impaai.user_profiles 
    SET 
        full_name = COALESCE((p_updates->>'full_name')::TEXT, full_name),
        phone = COALESCE((p_updates->>'phone')::TEXT, phone),
        company = COALESCE((p_updates->>'company')::TEXT, company),
        bio = COALESCE((p_updates->>'bio')::TEXT, bio),
        timezone = COALESCE((p_updates->>'timezone')::TEXT, timezone),
        language = COALESCE((p_updates->>'language')::TEXT, language),
        avatar_url = COALESCE((p_updates->>'avatar_url')::TEXT, avatar_url),
        preferences = COALESCE((p_updates->'preferences')::JSONB, preferences),
        theme_settings = COALESCE((p_updates->'theme_settings')::JSONB, theme_settings),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado ou nenhuma alteração feita'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'error', null,
        'message', 'Perfil atualizado com sucesso'
    );
END;
$$;


ALTER FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) OWNER TO supabase_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 334 (class 1259 OID 19613)
-- Name: activity_logs; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255),
    agent_id uuid,
    action character varying(255) NOT NULL,
    resource_type character varying(100),
    resource_id character varying(255),
    details jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.activity_logs OWNER TO supabase_admin;

--
-- TOC entry 335 (class 1259 OID 19621)
-- Name: agent_activity_logs; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.agent_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    activity_type character varying(100) NOT NULL,
    activity_data jsonb DEFAULT '{}'::jsonb,
    user_message text,
    agent_response text,
    response_time_ms integer,
    tokens_used integer,
    cost_estimate numeric(10,6),
    success boolean DEFAULT true,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.agent_activity_logs OWNER TO supabase_admin;

--
-- TOC entry 336 (class 1259 OID 19630)
-- Name: ai_agents; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.ai_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    whatsapp_connection_id uuid,
    evolution_bot_id character varying(255),
    name character varying(255) NOT NULL,
    description text,
    avatar_url text,
    identity_description text,
    training_prompt text NOT NULL,
    voice_tone character varying(50) DEFAULT 'humanizado'::character varying NOT NULL,
    main_function character varying(50) DEFAULT 'atendimento'::character varying NOT NULL,
    model character varying(100) DEFAULT 'gpt-3.5-turbo'::character varying,
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 1000,
    top_p numeric(3,2) DEFAULT 1.0,
    frequency_penalty numeric(3,2) DEFAULT 0.0,
    presence_penalty numeric(3,2) DEFAULT 0.0,
    model_config jsonb DEFAULT '{}'::jsonb,
    transcribe_audio boolean DEFAULT false,
    understand_images boolean DEFAULT false,
    voice_response_enabled boolean DEFAULT false,
    voice_provider character varying(20),
    voice_api_key text,
    voice_id character varying(255),
    calendar_integration boolean DEFAULT false,
    calendar_api_key text,
    calendar_meeting_id character varying(255),
    chatnode_integration boolean DEFAULT false,
    chatnode_api_key text,
    chatnode_bot_id text,
    orimon_integration boolean DEFAULT false,
    orimon_api_key text,
    orimon_bot_id text,
    is_default boolean DEFAULT false,
    listen_own_messages boolean DEFAULT false,
    stop_bot_by_me boolean DEFAULT true,
    keep_conversation_open boolean DEFAULT true,
    split_long_messages boolean DEFAULT true,
    character_wait_time integer DEFAULT 100,
    trigger_type character varying(50) DEFAULT 'all'::character varying,
    working_hours jsonb DEFAULT '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}'::jsonb,
    auto_responses jsonb DEFAULT '{}'::jsonb,
    fallback_responses jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'inactive'::character varying,
    last_training_at timestamp with time zone,
    performance_score numeric(3,2) DEFAULT 0.00,
    total_conversations integer DEFAULT 0,
    total_messages integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type character varying(50) DEFAULT 'whatsapp'::character varying,
    prompt_template text,
    trigger_operator character varying(20) DEFAULT 'equals'::character varying,
    trigger_value character varying(255),
    keyword_finish character varying(100) DEFAULT '#sair'::character varying,
    debounce_time integer DEFAULT 10,
    listening_from_me boolean DEFAULT false,
    stop_bot_from_me boolean DEFAULT true,
    keep_open boolean DEFAULT false,
    split_messages boolean DEFAULT true,
    time_per_char integer DEFAULT 100,
    delay_message integer DEFAULT 1000,
    unknown_message text DEFAULT 'Desculpe, não entendi. Digite a palavra-chave para começar.'::text,
    expire_time integer DEFAULT 0,
    ignore_jids text[] DEFAULT '{}'::text[],
    CONSTRAINT ai_agents_main_function_check CHECK (((main_function)::text = ANY (ARRAY[('atendimento'::character varying)::text, ('vendas'::character varying)::text, ('agendamento'::character varying)::text, ('suporte'::character varying)::text, ('qualificacao'::character varying)::text]))),
    CONSTRAINT ai_agents_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('training'::character varying)::text, ('error'::character varying)::text]))),
    CONSTRAINT ai_agents_temperature_check CHECK (((temperature >= (0)::numeric) AND (temperature <= (2)::numeric))),
    CONSTRAINT ai_agents_trigger_operator_check CHECK (((trigger_operator IS NULL) OR ((trigger_operator)::text = ANY (ARRAY[('equals'::character varying)::text, ('contains'::character varying)::text, ('startsWith'::character varying)::text, ('endsWith'::character varying)::text, ('regex'::character varying)::text])))),
    CONSTRAINT ai_agents_trigger_type_check CHECK (((trigger_type IS NULL) OR ((trigger_type)::text = ANY (ARRAY[('keyword'::character varying)::text, ('all'::character varying)::text])))),
    CONSTRAINT ai_agents_voice_provider_check CHECK (((voice_provider)::text = ANY (ARRAY[('fish_audio'::character varying)::text, ('eleven_labs'::character varying)::text]))),
    CONSTRAINT ai_agents_voice_tone_check CHECK (((voice_tone)::text = ANY (ARRAY[('humanizado'::character varying)::text, ('formal'::character varying)::text, ('tecnico'::character varying)::text, ('casual'::character varying)::text, ('comercial'::character varying)::text]))),
    CONSTRAINT check_trigger_operator CHECK (((trigger_operator)::text = ANY (ARRAY[('equals'::character varying)::text, ('contains'::character varying)::text, ('startsWith'::character varying)::text, ('endsWith'::character varying)::text, ('regex'::character varying)::text]))),
    CONSTRAINT check_trigger_type CHECK (((trigger_type)::text = ANY (ARRAY[('keyword'::character varying)::text, ('all'::character varying)::text])))
);


ALTER TABLE impaai.ai_agents OWNER TO supabase_admin;

--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 336
-- Name: TABLE ai_agents; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.ai_agents IS 'Agentes de IA configurados';


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.model_config; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.model_config IS 'Configurações do modelo de IA e Evolution API em formato JSON';


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.chatnode_integration; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.chatnode_api_key; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.chatnode_bot_id; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.orimon_integration; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.orimon_api_key; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.orimon_bot_id; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.trigger_type; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_type IS 'Tipo de ativação: keyword ou all';


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.trigger_operator; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_operator IS 'Operador para comparação: equals, contains, startsWith, endsWith, regex';


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.trigger_value; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_value IS 'Palavra-chave ou valor para ativação';


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.keyword_finish; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.keyword_finish IS 'Palavra-chave para finalizar conversa';


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.debounce_time; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.debounce_time IS 'Tempo de debounce em segundos';


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.listening_from_me; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.listening_from_me IS 'Se deve escutar mensagens enviadas pelo próprio usuário';


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.stop_bot_from_me; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.stop_bot_from_me IS 'Se mensagens do usuário param o bot';


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.keep_open; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.keep_open IS 'Se deve manter a conversa sempre aberta';


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.split_messages; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.split_messages IS 'Se deve dividir mensagens longas';


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.delay_message; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.delay_message IS 'Delay entre mensagens em milissegundos';


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.unknown_message; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.unknown_message IS 'Mensagem padrão para quando não entender';


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.expire_time; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.expire_time IS 'Tempo de expiração da conversa em minutos (0 = sem expiração)';


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 336
-- Name: COLUMN ai_agents.ignore_jids; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.ignore_jids IS 'Lista de JIDs para ignorar (grupos, etc)';


--
-- TOC entry 337 (class 1259 OID 19689)
-- Name: bookings_cal; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.bookings_cal (
    id bigint NOT NULL,
    "Titulo da reuniao" text,
    "Empresa" text,
    email_da_empresa text,
    status text,
    inicio_reuniao timestamp with time zone,
    fim_da_reuniao timestamp with time zone,
    "duração" text,
    id_evento bigint,
    slug_evento text,
    "meetingUrl" text,
    localizacao text,
    "Nome do Participante" text,
    email_do_participante text,
    whatsapp text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    lembrete_enviado boolean DEFAULT false,
    lembrete_24h_enviado boolean DEFAULT false,
    lembrete_3h_enviado boolean DEFAULT false
);


ALTER TABLE impaai.bookings_cal OWNER TO supabase_admin;

--
-- TOC entry 338 (class 1259 OID 19699)
-- Name: bookings_cal_id_seq; Type: SEQUENCE; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE impaai.bookings_cal ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME impaai.bookings_cal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 339 (class 1259 OID 19700)
-- Name: conversations; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    whatsapp_connection_id uuid,
    contact_phone character varying(20) NOT NULL,
    contact_name character varying(255),
    status character varying(50) DEFAULT 'active'::character varying,
    last_message_at timestamp with time zone,
    message_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('closed'::character varying)::text, ('archived'::character varying)::text])))
);


ALTER TABLE impaai.conversations OWNER TO supabase_admin;

--
-- TOC entry 340 (class 1259 OID 19712)
-- Name: folowUp24hs_mensagem; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai."folowUp24hs_mensagem" (
    id bigint NOT NULL,
    whatsapp_conenections_id uuid NOT NULL,
    tentativa_dia numeric,
    tipo_mensagem impaai.tipo_midia,
    mensagem text,
    link text,
    CONSTRAINT chk_link_required CHECK ((((tipo_mensagem = 'text'::impaai.tipo_midia) AND (link IS NULL)) OR ((tipo_mensagem <> 'text'::impaai.tipo_midia) AND (link IS NOT NULL)))),
    CONSTRAINT chk_mensagem_content_rules CHECK ((((tipo_mensagem = 'text'::impaai.tipo_midia) AND (mensagem IS NOT NULL)) OR ((tipo_mensagem = 'audio'::impaai.tipo_midia) AND (mensagem IS NULL)) OR (tipo_mensagem = ANY (ARRAY['video'::impaai.tipo_midia, 'document'::impaai.tipo_midia, 'image'::impaai.tipo_midia]))))
);


ALTER TABLE impaai."folowUp24hs_mensagem" OWNER TO supabase_admin;

--
-- TOC entry 341 (class 1259 OID 19719)
-- Name: folowUp24hs_mensagem_id_seq; Type: SEQUENCE; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE impaai."folowUp24hs_mensagem" ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME impaai."folowUp24hs_mensagem_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 342 (class 1259 OID 19720)
-- Name: integrations; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.integrations OWNER TO supabase_admin;

--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 342
-- Name: TABLE integrations; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.integrations IS 'Integrações externas disponíveis';


--
-- TOC entry 343 (class 1259 OID 19730)
-- Name: lead_folow24hs; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.lead_folow24hs (
    id bigint NOT NULL,
    "whatsappConection" uuid NOT NULL,
    "remoteJid" text,
    dia numeric,
    updated_at timestamp with time zone
);


ALTER TABLE impaai.lead_folow24hs OWNER TO supabase_admin;

--
-- TOC entry 344 (class 1259 OID 19735)
-- Name: lead_folow24hs_id_seq; Type: SEQUENCE; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE impaai.lead_folow24hs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME impaai.lead_folow24hs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 345 (class 1259 OID 19736)
-- Name: messages; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    agent_id uuid,
    direction character varying(20) NOT NULL,
    content text NOT NULL,
    message_type character varying(50) DEFAULT 'text'::character varying,
    media_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_direction_check CHECK (((direction)::text = ANY (ARRAY[('incoming'::character varying)::text, ('outgoing'::character varying)::text]))),
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY (ARRAY[('text'::character varying)::text, ('image'::character varying)::text, ('audio'::character varying)::text, ('video'::character varying)::text, ('document'::character varying)::text])))
);


ALTER TABLE impaai.messages OWNER TO supabase_admin;

--
-- TOC entry 351 (class 1259 OID 20268)
-- Name: shared_whatsapp_links; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.shared_whatsapp_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    password_hash text,
    salt text,
    permissions jsonb DEFAULT '{"stats": false, "qr_code": true, "settings": false}'::jsonb NOT NULL,
    expires_at timestamp with time zone,
    max_uses integer,
    current_uses integer DEFAULT 0,
    is_active boolean DEFAULT true,
    last_accessed_at timestamp with time zone,
    last_accessed_ip inet,
    access_logs jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.shared_whatsapp_links OWNER TO supabase_admin;

--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 351
-- Name: TABLE shared_whatsapp_links; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.shared_whatsapp_links IS 'Links compartilhados seguros para conexões WhatsApp';


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 351
-- Name: COLUMN shared_whatsapp_links.token; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.shared_whatsapp_links.token IS 'Token único e seguro para acesso ao link';


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 351
-- Name: COLUMN shared_whatsapp_links.password_hash; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.shared_whatsapp_links.password_hash IS 'Hash da senha para acesso adicional (opcional)';


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 351
-- Name: COLUMN shared_whatsapp_links.permissions; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.shared_whatsapp_links.permissions IS 'Permissões granulares: qr_code, stats, settings';


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 351
-- Name: COLUMN shared_whatsapp_links.access_logs; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.shared_whatsapp_links.access_logs IS 'Log de acessos com timestamp, IP e user-agent';


--
-- TOC entry 346 (class 1259 OID 19747)
-- Name: system_settings; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(255) NOT NULL,
    setting_value jsonb NOT NULL,
    category character varying(100) DEFAULT 'general'::character varying,
    description text,
    is_public boolean DEFAULT false,
    requires_restart boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.system_settings OWNER TO supabase_admin;

--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE system_settings; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.system_settings IS 'Configurações globais do sistema';


--
-- TOC entry 347 (class 1259 OID 19758)
-- Name: system_themes; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.system_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    colors jsonb NOT NULL,
    fonts jsonb DEFAULT '{}'::jsonb,
    borders jsonb DEFAULT '{}'::jsonb,
    logo_icon character varying(10) DEFAULT '🤖'::character varying,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE impaai.system_themes OWNER TO supabase_admin;

--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE system_themes; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.system_themes IS 'Temas visuais do sistema';


--
-- TOC entry 348 (class 1259 OID 19771)
-- Name: user_api_keys; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.user_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    api_key character varying(255) DEFAULT impaai.generate_api_key() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    permissions jsonb DEFAULT '["read"]'::jsonb,
    rate_limit integer DEFAULT 100,
    is_active boolean DEFAULT true,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    access_scope character varying(50) DEFAULT 'user'::character varying,
    is_admin_key boolean DEFAULT false,
    allowed_ips jsonb DEFAULT '[]'::jsonb,
    usage_count integer DEFAULT 0,
    CONSTRAINT user_api_keys_access_scope_check CHECK (((access_scope)::text = ANY (ARRAY[('user'::character varying)::text, ('admin'::character varying)::text, ('system'::character varying)::text])))
);


ALTER TABLE impaai.user_api_keys OWNER TO supabase_admin;

--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE user_api_keys; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.user_api_keys IS 'Chaves de API dos usuários';


--
-- TOC entry 349 (class 1259 OID 19788)
-- Name: user_profiles; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    avatar_url text,
    phone character varying(20),
    company character varying(255),
    bio text,
    timezone character varying(100) DEFAULT 'America/Sao_Paulo'::character varying,
    language character varying(10) DEFAULT 'pt-BR'::character varying,
    api_key character varying(255) DEFAULT impaai.generate_api_key(),
    email_verified boolean DEFAULT false,
    preferences jsonb DEFAULT '{}'::jsonb,
    theme_settings jsonb DEFAULT '{"mode": "light", "color": "blue"}'::jsonb,
    agents_limit integer DEFAULT 3,
    connections_limit integer DEFAULT 5,
    monthly_messages_limit integer DEFAULT 1000,
    last_login_at timestamp with time zone,
    login_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profiles_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('user'::character varying)::text, ('moderator'::character varying)::text]))),
    CONSTRAINT user_profiles_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('suspended'::character varying)::text])))
);


ALTER TABLE impaai.user_profiles OWNER TO supabase_admin;

--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 349
-- Name: TABLE user_profiles; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.user_profiles IS 'Perfis dos usuários do sistema';


--
-- TOC entry 350 (class 1259 OID 19810)
-- Name: whatsapp_connections; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.whatsapp_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    connection_name character varying(255) NOT NULL,
    instance_name character varying(255) NOT NULL,
    instance_id character varying(255),
    instance_token text,
    phone_number character varying(20),
    status character varying(50) DEFAULT 'disconnected'::character varying,
    qr_code text,
    qr_expires_at timestamp with time zone,
    webhook_url text,
    webhook_events jsonb DEFAULT '["message"]'::jsonb,
    settings jsonb DEFAULT '{}'::jsonb,
    auto_reconnect boolean DEFAULT true,
    max_reconnect_attempts integer DEFAULT 5,
    reconnect_interval integer DEFAULT 30,
    messages_sent integer DEFAULT 0,
    messages_received integer DEFAULT 0,
    last_message_at timestamp with time zone,
    last_seen_at timestamp with time zone,
    uptime_percentage numeric(5,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    adciona_folow text DEFAULT 'Gostaria de auxilio, algo mais?'::text,
    remover_folow text DEFAULT 'Agradecemos seu contato, Até Mais!'::text,
    CONSTRAINT whatsapp_connections_status_check CHECK (((status)::text = ANY (ARRAY[('connected'::character varying)::text, ('disconnected'::character varying)::text, ('connecting'::character varying)::text, ('error'::character varying)::text, ('banned'::character varying)::text])))
);


ALTER TABLE impaai.whatsapp_connections OWNER TO supabase_admin;

--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 350
-- Name: TABLE whatsapp_connections; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.whatsapp_connections IS 'Conexões WhatsApp dos usuários';


--
-- TOC entry 4316 (class 0 OID 19613)
-- Dependencies: 334
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.activity_logs (id, user_id, agent_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 4317 (class 0 OID 19621)
-- Dependencies: 335
-- Data for Name: agent_activity_logs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.agent_activity_logs (id, agent_id, activity_type, activity_data, user_message, agent_response, response_time_ms, tokens_used, cost_estimate, success, error_message, created_at) FROM stdin;
\.


--
-- TOC entry 4318 (class 0 OID 19630)
-- Dependencies: 336
-- Data for Name: ai_agents; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.ai_agents (id, user_id, whatsapp_connection_id, evolution_bot_id, name, description, avatar_url, identity_description, training_prompt, voice_tone, main_function, model, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, model_config, transcribe_audio, understand_images, voice_response_enabled, voice_provider, voice_api_key, voice_id, calendar_integration, calendar_api_key, calendar_meeting_id, chatnode_integration, chatnode_api_key, chatnode_bot_id, orimon_integration, orimon_api_key, orimon_bot_id, is_default, listen_own_messages, stop_bot_by_me, keep_conversation_open, split_long_messages, character_wait_time, trigger_type, working_hours, auto_responses, fallback_responses, status, last_training_at, performance_score, total_conversations, total_messages, created_at, updated_at, type, prompt_template, trigger_operator, trigger_value, keyword_finish, debounce_time, listening_from_me, stop_bot_from_me, keep_open, split_messages, time_per_char, delay_message, unknown_message, expire_time, ignore_jids) FROM stdin;
8002a6ad-d15c-445e-a247-5350d776b7fa\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t\\\\N\\tcmerog7rb0gmzqw5pe6110t6n\\tbreno teste1\\t\\\\N\\t\\\\N\\tContexto: Você é Breno, da JuriMind (você fala português brasileiro), uma agência especializada em tráfego pago para advogados. Localizada em Curitiba, mas com atendimento em todo o Brasil. Sua missão é proporcionar uma experiência leve, acolhedora e assertiva, guiando o cliente a entender como a JuriMind pode resolver suas necessidades e, eventualmente, agendar uma reunião. Você fala exclusivamente com advogados.\\tObjetivo: Criar uma conexão genuína com o cliente, entender suas necessidades e oferecer soluções relevantes, conduzindo a conversa de forma natural para o agendamento de uma reunião.\\\\n\\\\n<Etapas do Atendimento>\\\\n\\\\n1- Apresentação Inicial e Conexão\\\\nSempre inicie se apresentando:\\\\n>Olá, tudo bem? \\\\n\\\\n>Eu sou Breno Muller, da JuriMind - Agência especializada em tráfego pago para advogados. \\\\n\\\\n>Com quem estou falando?\\\\n\\\\n2- Criação de Conexão\\\\nPergunte o nome do cliente e tente criar uma conexão:\\\\nQue bom falar com você! A JuriMind trabalha exclusivamente com escritórios de advocacia.\\\\n\\\\nAtualmente com nossos serviços são:\\\\n-Tráfego pago, seriam os anúncios online.\\\\n-Criação de landing pages\\\\n-Inteligência Artificial para fazer os atendimentos. \\\\n\\\\nSobre qual gostaria de mais informações?\\\\n\\\\n3- Caso o cliente pergunte sobre Landing page e sobre IA, traga as informações referentes e após caso ele tenha interesse Pule para a opção 5 para realizar o agendamento de reunião. \\\\n\\\\nCaso o cliente queira atendimento para anúncios online, tráfego pago Pergunte sobre a Área Jurídica do Cliente\\\\nPergunte sobre a área do direito em que ele atua:\\\\nEm qual área do direito você atua? Aqui na JuriMind, ajudamos advogados a encontrar clientes em diversas especialidades, como Direito Trabalhista, Previdenciário, e muito mais.\\\\n\\\\n4- Sugestão de Reunião de forma natural\\\\nCom base no que você me disse, acredito que podemos ajudar bastante com sua estratégia de anúncios. Temos opções de investimento em anúncios a partir de R$ 699 por mês, mais o investimento que você faz na plataforma a recomendação é de mil reais. Isso está dentro do que você busca?\\\\n\\\\n5- Se o cliente mostrar interesse em agendar, agradeça e mande somente uma mensagem com toda a informação a seguir em uma única string:\\\\nObrigado pelo seu interesse. Para prosseguirmos o próximo passo é conversar agendarmos uma conversa consultiva.\\\\nQuais os melhores dias e horários?\\\\n</Etapas do Atendimento>\\\\n\\\\n<agendamento>\\\\nUtilize as tools de cria agendamento, disponibilidade e cancela_agendamento conforme a necessidade do cliente.\\\\n</agendamento>\\\\n\\\\n<Manejo de Perguntas sobre Pacotes>\\\\nCaso o cliente pergunte sobre os pacotes disponíveis, utilize a seguinte resposta:\\\\n“Temos 3 planos de anúncios, o Essencial, o Crescimento e o Profissional, de acordo com suas necessidades e objetivos de marketing."\\\\n\\\\n"-Plano Essencial (Vagas limitadas) , Valor R$397,00/mês: Nessa opção trabalhamos com uma plataforma de Anúncios. Meta Ads ou Google Ads. \\\\nAcompanhamento e suporte em grupo do Whatsapp;\\\\nCriação e gestão das campanhas;\\\\nPlanilha de acompanhamento dos leads inclusa!\\\\nValor máximo que podera ser investido em anúncios nessa opção é R$1.000,00 mais que isso passa para o plano Crescimento"\\\\n\\\\n"- Plano Crescimento, Valor R$699,00/mês: Nessa opção de anúncios, trabalhamos com Google Ads E Meta Ads simultaneamente para maximizar a visibilidade do seu escritório.\\\\nSuporte especializado em advocacia.\\\\nCriação e Gestão de campanhas \\\\nRastreio e Trackeamento dos Leads GTM. \\\\nCriação de anúncios estáticos\\\\nRelatórios Semanais\\\\nInformativo de Orçamento Semanal\\\\nJuriMind Automatics - Controle em tempo real da chegada de Leads, salvando em um banco de dados.\\\\nInvestimento máximo R$2.000,00 em anúncios, mais que isso passa para o plano Profissional"\\\\n\\\\n"- Plano Profissional, Valor R$1.200,00/mês: Nessa opção de anúncios, trabalhamos com Google Ads E Meta Ads simultaneamente para maximizar a visibilidade do seu escritório.\\\\nSuporte especializado em advocacia.\\\\nCriação e Gestão de campanhas \\\\nRastreio e Trackeamento dos Leads GTM. \\\\nCriação de anúncios estáticos\\\\nRelatórios Semanais\\\\nInformativo de Orçamento Semanal\\\\nJuriMind Automatics - Controle em tempo real da chegada de Leads, salvando em um banco de dados.\\\\nCriação de IA: atendimento qualificatório no Whatsapp.\\\\nLanding Page inclusa durante o período de assessoria.\\\\nCriação do Google meu Negócio.\\\\nSem limite para investimento máximo."\\\\n\\\\nEssas são as informações sobre os plano de tráfego pago. \\\\n\\\\nOferecemos também serviço de Landing page e Inteligência artificial a parte dos planos de tráfego pago.\\\\n\\\\n<Landing Page>\\\\nA JuriMind desenvolve landing pages com um robô de atendimento na própria página, já cadastrando todos os leads em uma planilha. Isso ajuda o advogado na organização dos leads recebidos. Nossa landing page tem o valor de R$ 699,90, podendo ser parcelado em 10 vezes sem juros de R$69,90.\\\\n\\\\n<inteligência Artificial>\\\\n- Serviço de IA (Inteligência Artificial): Valor mensal R$ 150,00 + taxa de implantação de R$ 250,00 no primeiro mês. Com limite de até 10.000 mensagens por mês, o que dá e sobra para responder todos os leads. Ela faz o papel de SDR do escritório de advocacia, reponde texto e áudio. Ela já está inclusa no plano profissional de tráfego pago. Para contratação e mais informações é preciso falar com nosso especialista via meet.\\\\n\\\\n<Manejo de Perguntas sobre Preço>\\\\nCaso o cliente pergunte sobre preços, utilize uma abordagem focada no valor:\\\\n"Temos opções a partir de R$699,00, para anúncios, um valor acessível para a maioria dos advogados. Esse valor pode ser ajustado conforme o crescimento da campanha. O que achou?"\\\\nNa sequência, questione: "Gostaria de conversar com o especialista e entender melhor como a JuriMind pode ajudar?"\\\\nCaso sim, envie a mensagem agendando a reunião conforme o item 5 das etapas do atendimento.\\\\n\\\\n<Diferenciais da JuriMind>\\\\nDestaque os diferenciais da JuriMind de forma objetiva:\\\\n- Sem contrato de fidelidade: "Trabalhamos sem contrato de fidelidade, nossos clientes ficam porque veem resultados."\\\\n- Formas de pagamento flexíveis: "Aceitamos cartão de crédito, débito, Pix e boleto."\\\\n- Sem taxas ocultas: "Todos os custos são claros e transparentes, sem surpresas desagradáveis."\\\\n- Atualizações constantes: "Estamos sempre atualizando nossos clientes sobre as últimas tendências no marketing digital."\\\\nSe o cliente não demonstrar interesse imediato, finalize a conversa de forma aberta:\\\\n"Obrigado pelo seu tempo. Estou à disposição para qualquer dúvida que você tenha."\\\\nValide as preocupações do cliente e mostre empatia:\\\\n"Entendo que pode ser desafiador escolher a melhor estratégia de marketing. Vamos trabalhar juntos para garantir que você tenha os melhores resultados."\\\\n\\\\n<Adições>\\\\n- Caso o cliente comente sobre produtos jurídicos, considere o mesmo que áreas específicas do direito.\\\\n- Escutar Ativamente: Sempre que o cliente fizer uma pergunta ou expressar preocupação, repita ou resuma a informação para mostrar que está ouvindo e entendendo.\\\\n- Identificar a Dor do Cliente: Faça perguntas abertas para entender melhor a situação do cliente e construir um relacionamento. Pergunte de forma clara: "Qual é o maior desafio que você está enfrentando agora?"\\\\n- Urgência: Crie um senso de urgência ao mencionar que as oportunidades no marketing digital são dinâmicas, e que a reunião pode ser o primeiro passo para não ficar para trás.\\\\n- Feedback do Cliente: Pergunte se o cliente está satisfeito com as informações fornecidas e se há algo mais que ele gostaria de saber.\\\\nA JuriMind, com sede em Curitiba, atua nacionalmente, atendendo escritórios de advocacia em todo o Brasil.\\\\nO valor de investimento em créditos no Google Ads sugerido pelos analistas, seja no plano de crescimento ou no plano profissional é de R$1.000,00 (mil reais) por mês. No Meta Ads (Facebook e Instagram), o valor sugerido também é de R$1.000,00 (mil reais) por mês. É possível investir menos, porém, a quantidade de dados obtidos será menor e, consequentemente, as otimizações serão menos efetivas por não coletar tantos dados de análise.\\\\n<REGRA>\\\\nNUNCA termine uma frase sem sentido, sempre respeite o número máximo de 150 caracteres por frase.\\\\nCaso o cliente mande algo que não entenda, como um emoji, responde "Não entendi, poderia repetir?"\\\\n\\thumanizado\\tatendimento\\tgpt-4.1-mini\\t0.80\\t1000\\t1.00\\t0.00\\t0.00\\t"openai"\\tt\\tt\\tt\\tfish_audio\\tfc4ab0973a71428abe6e6e4a788a1a25\\t6234624ffac04a08964311be8134c2b8\\tt\\tcal_live_60ff9b4f280414c99cc883c2c7f65ab0\\t3200139\\tf\\t\\\\N\\t\\\\N\\tf\\t\\\\N\\t\\\\N\\tf\\tf\\tt\\tt\\tt\\t100\\tkeyword\\t{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}\\t{}\\t{}\\tactive\\t\\\\N\\t0.00\\t0\\t0\\t2025-08-25 22:16:56.774894+00\\t2025-09-03 13:11:56.478383+00\\twhatsapp\\t\\\\N\\tequals\\tteste123\\t#sair\\t5\\tt\\tt\\tt\\tt\\t100\\t100\\tDesculpe, não entendi sua mensagem.\\t0\\t{@g.us}
45bbfab6-a94b-452b-b585-1d875f237899\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tcda073b3-2e6a-418b-a44c-abca6a3477e3\\tcmf2vn8l72x34mx5p3ijubcnu\\tbrocanello\\t\\\\N\\t\\\\N\\tVocê é Doutor Indeniza, do Escritório Brocanello & Daroz Advogados.\\\\n\\tSeu papel é acolher leads vindos de anúncios online e realizar um atendimento jurídico inicial, como uma pessoa humana, empática e atenta.\\\\n🗣 Comunicação: português brasileiro, profissional, acolhedora, educada e objetiva, sem demonstrar que é um robô ou IA.\\\\n🎯 Objetivo: Ouvir, entender e registrar a situação do cliente com clareza, sempre com foco em agendar um próximo contato, sem fornecer parecer jurídico ou valores neste primeiro momento.\\\\n⚠️ Regras Gerais:\\\\n❌ NÃO demonstre ser IA ou robô\\\\n❌ NÃO forneça parecer jurídico\\\\n❌ NÃO mencione valores\\\\n❌ Não agende reunião\\\\n❌ NÃO pergunte se o cliente já tomou providências ou procurou outras ajudas\\\\n✅ Faça apenas perguntas essenciais, curtas e objetivas\\\\n✅ Faça uma pergunta por vez, aguarde sempre a resposta\\\\n✅ Seja natural, acolhedor e profissional\\\\n\\\\n\\\\n\\\\n📍 Etapas do Atendimento:\\\\n\\\\n🔹 Etapa 1 – Saudação Inicial\\\\nOlá, tudo bem? Qual é o seu nome?\\\\nMeu nome é Doutor Indeniza, serei o responsável pelo atendimento inicial.\\\\n\\\\nComo posso ajudar hoje?\\\\n\\\\n🔹 Etapa 2 – Entendimento Inicial da Situação\\\\nIdentifique rapidamente o tipo de caso (trabalhista, cível, família, consumidor, previdenciário, etc.). Faça perguntas diretas e específicas, adaptando ao contexto:\\\\n"Poderia me explicar um pouco mais o que aconteceu, se preferir pode enviar áudio, ok?"\\\\n\\\\n\\\\n\\\\nSe o cliente perguntar sobre valores, responda brevemente:\\\\n"Para falarmos sobre valores, precisamos primeiro detalhar o contexto do seu caso. Posso verificar o melhor horário para nosso advogado entrar em contato com você?"\\\\n\\\\n🔹 Etapa 3 – Verificação Direta e Simples dos Requisitos\\\\nFaça perguntas curtas e objetivas apenas se necessário para complementar a compreensão do caso. \\\\n\\\\nCaso seja:\\\\nCorte de energia eletrica ou luz pergunte:\\\\n>Qual o dia que foi cortada a energia?\\\\n>Se foi em um dia proibido o corte é indevido. Os dias proibidos são sextas-feiras, sábados ,domingos, feriados e véspera de feriados. \\\\n>Realizou o pagamento da conta de luz, tem o comprovante ? \\\\n> Possui registro de ligação com a empresa, a própria gravação da ligação ou protocolos de atendimento?\\\\n\\\\nSempre utilize escuta ativa e pergunte apenas quando realmente precisar complementar a informação.\\\\n\\\\n🔹 Etapa 4 – Finalização Breve\\\\n"Perfeito, obrigado pelas informações. Tem algo mais importante que gostaria de acrescentar?"\\\\n\\\\n🔹 Etapa 5 – Disponibilidade para Contato\\\\nSempre direcione a conversa para o próximo passo, buscando horários para o advogado entrar em contato:\\\\n"Vou analisar o seu caso. Quais são os melhores dias e horários para conversarmos?"\\\\n\\\\n🔹 Etapa 6 – Encerramento\\\\n"Ótimo! Vou verificar a agenda e retorno em breve. Agradeço pelo contato e fico à disposição. 🤝"\\\\n\\\\n📌 Importante:\\\\nCaso o cliente demonstre interesse em seguir com a ação judicial ou atendimento jurídico, avance diretamente para a etapa 5.\\\\nSe o cliente sair do assunto jurídico, responda apenas uma vez:\\\\n"Posso ajudar apenas com assuntos jurídicos durante este atendimento inicial, tudo bem?"\\\\n\\\\n<local de atendimento>\\\\nPresencial em São Paulo ou Online em todo o Brasil.\\\\n</local de atendimento>\\\\n\\\\n<endereço>\\\\nNosso escritório está localizado na Rua São João, 657, Sala 411, Patrimônio São João Batista, Boulevard Shopping, Olímpia, Estado de São Paulo, CEP 15400-065.\\\\n</endereço>\\thumanizado\\tatendimento\\tgpt-4o-mini\\t0.70\\t1000\\t1.00\\t0.00\\t0.00\\t"openai"\\tt\\tt\\tf\\t\\\\N\\t\\\\N\\t\\\\N\\tf\\t\\\\N\\t\\\\N\\tf\\t\\\\N\\t\\\\N\\tf\\t\\\\N\\t\\\\N\\tf\\tf\\tt\\tt\\tt\\t100\\tkeyword\\t{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}\\t{}\\t{}\\tactive\\t\\\\N\\t0.00\\t0\\t0\\t2025-09-02 18:23:49.720127+00\\t2025-09-03 16:22:07.029602+00\\twhatsapp\\t\\\\N\\tequals\\t2\\t#sair\\t4\\tt\\tt\\tt\\tt\\t100\\t1000\\tDesculpe, não entendi sua mensagem.\\t0\\t{@g.us}
84986a53-bb78-433d-a054-00d0c487e0d0\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t455daee8-8510-4aea-b87f-d4102c72e34c\\tcmf1ghf5z2rxvmx5pxqbvosxk\\tBreno-comercial \\t\\t\\\\N\\tVocê é Breno, da JuriMind, uma agência especializada em tráfego pago para advogados. \\tContexto:\\\\nLocalizada em Curitiba, mas com atendimento em todo o Brasil. Nossa missão é proporcionar uma experiência leve, acolhedora e assertiva, guiando o cliente a entender como a JuriMind pode resolver suas necessidades e, eventualmente, agendar uma reunião. Falamos exclusivamente com advogados.\\\\n\\\\nObjetivo:\\\\nCriar uma conexão genuína com o cliente, entender suas necessidades e oferecer soluções relevantes, conduzindo a conversa de forma natural para o agendamento de uma reunião.\\\\n\\\\nEtapas do Atendimento\\\\n1 – Apresentação Inicial e Conexão\\\\n\\\\nSempre inicie se apresentando:\\\\n\\\\nOlá, tudo bem?\\\\nEu sou Breno Muller, da JuriMind – Agência especializada em tráfego pago para advogados.\\\\nCom quem estou falando?\\\\n\\\\n2 – Conexão e Diagnóstico Inicial\\\\n\\\\nApós o cliente responder, demonstre proximidade:\\\\n\\\\nQue bom falar com você! A JuriMind trabalha exclusivamente com escritórios de advocacia.\\\\n\\\\nApresente brevemente os serviços:\\\\n\\\\nTráfego Pago: anúncios online no Google e nas redes sociais\\\\n\\\\nLanding Pages: páginas de captura profissionais\\\\n\\\\nInteligência Artificial: atendimento automatizado via WhatsApp\\\\n\\\\nFaça o diagnóstico inicial:\\\\n\\\\nEm qual área do direito você atua?\\\\nVocê já investiu em anúncios online antes?\\\\n\\\\n3 – Qualificação de Investimento (se já tiver investido)\\\\n\\\\nCaso o cliente já tenha investido em anúncios, pergunte:\\\\n\\\\nÓtimo! Qual foi o valor que você investiu?\\\\nFoi um investimento mensal ou pontual?\\\\n\\\\n4 – Entendimento de Expectativas\\\\n\\\\nPergunta consultiva para ampliar o entendimento:\\\\n\\\\nO que uma agência poderia oferecer para você hoje, além de um resultado melhor em recebimento de leads?\\\\nAssim conseguimos atender melhor suas expectativas para além do tráfego pago que já iremos trabalhar.\\\\n\\\\n5 – Agendamento da Reunião\\\\n\\\\nConvide de forma natural:\\\\n\\\\nPodemos conversar melhor em uma reunião para apresentar o valor do nosso trabalho e os preços de cada opção.\\\\nVou verificar na nossa ferramenta de agendamento as datas disponíveis e já marcar para você.\\\\n\\\\nImportante: utilize a ferramenta de agendamento para verificar as datas e realizar o agendamento para o cliente.\\\\n\\\\n6 – Confirmação\\\\n\\\\nApós confirmar a reunião, envie:\\\\n\\\\nObrigado pelo seu interesse! A reunião foi agendada.\\\\nSerá uma videochamada para entendermos melhor seu escritório e apresentar o melhor plano para você.\\\\n\\\\nManejo de Perguntas sobre Pacotes\\\\n\\\\n“Temos 3 planos de anúncios: Essencial, Crescimento e Profissional, de acordo com suas necessidades e objetivos de marketing.”\\\\n\\\\nPlano Essencial (R$ 397/mês)\\\\n\\\\nMeta Ads ou Google Ads\\\\n\\\\nSuporte em grupo no WhatsApp\\\\n\\\\nCriação e gestão de campanhas\\\\n\\\\nPlanilha de acompanhamento de leads inclusa\\\\n\\\\nInvestimento máximo em anúncios: R$ 1.000\\\\n\\\\nPlano Crescimento (R$ 699/mês)\\\\n\\\\nMeta Ads e Google Ads\\\\n\\\\nSuporte especializado\\\\n\\\\nCriação e gestão de campanhas\\\\n\\\\nRastreio de leads via GTM\\\\n\\\\nCriação de anúncios estáticos\\\\n\\\\nRelatórios semanais + informativo de orçamento\\\\n\\\\nJuriMind Automatics (controle em tempo real dos leads)\\\\n\\\\nInvestimento máximo: R$ 2.000\\\\n\\\\nPlano Profissional (R$ 1.200/mês)\\\\n\\\\nMeta Ads e Google Ads\\\\n\\\\nTudo do plano Crescimento\\\\n\\\\nIA de atendimento no WhatsApp inclusa\\\\n\\\\nLanding Page inclusa\\\\n\\\\nCriação do Google Meu Negócio\\\\n\\\\nSem limite de investimento em anúncios\\\\n\\\\nLanding Page\\\\n\\\\nDesenvolvemos landing pages com robô de atendimento integrado, salvando os leads diretamente em planilha.\\\\nValor: R$ 699,90 (10x de R$ 69,90 sem juros).\\\\n\\\\nInteligência Artificial\\\\n\\\\nIA faz papel de SDR do escritório, responde texto e áudio.\\\\nR$ 150/mês + implantação R$ 350 no 1º mês.\\\\nLimite de 10.000 mensagens/mês.\\\\nInclusa no plano Profissional.\\\\n\\\\nManejo de Perguntas sobre Preço\\\\n\\\\nQuando perguntarem sobre valores:\\\\n\\\\nTemos opções a partir de R$ 699,00 para anúncios, valor acessível para a maioria dos advogados. Esse valor pode ser ajustado conforme o crescimento da campanha. O que achou?\\\\n\\\\nEm seguida:\\\\n\\\\nGostaria que eu verificasse uma data para conversarmos em reunião e entender melhor como a JuriMind pode ajudar?\\\\n\\\\nDiferenciais da JuriMind\\\\n\\\\nSem contrato de fidelidade: o cliente fica porque vê resultados.\\\\n\\\\nFormas de pagamento flexíveis: cartão, Pix, boleto.\\\\n\\\\nTransparência: sem taxas ocultas ou surpresas.\\\\n\\\\nAtualizações constantes: clientes sempre informados sobre tendências do marketing digital.\\\\n\\\\nBoas Práticas\\\\n\\\\nEscute ativamente e valide o que o cliente disser.\\\\n\\\\nRepita ou resuma para mostrar que entendeu.\\\\n\\\\nMostre empatia sempre.\\\\n\\\\nFinalize de forma acolhedora, mesmo se o cliente não estiver pronto para avançar:\\\\n\\\\nObrigado pelo seu tempo! Fico à disposição para qualquer dúvida.\\\\n\\\\nObservações Finais\\\\n\\\\nUtilize sempre frases com no máximo 150 caracteres para manter objetividade.\\\\n\\\\nSe receber mensagens incompreensíveis (como apenas um emoji), responda:\\\\n\\\\nNão entendi, poderia repetir?\\thumanizado\\tatendimento\\tgpt-4.1-mini\\t0.70\\t1000\\t1.00\\t0.00\\t0.00\\t"openai"\\tt\\tt\\tf\\t\\\\N\\t\\\\N\\t\\\\N\\tt\\tcal_live_60ff9b4f280414c99cc883c2c7f65ab0\\t3200139\\tf\\t\\\\N\\t\\\\N\\tf\\t\\\\N\\t\\\\N\\tf\\tf\\tt\\tt\\tt\\t100\\tkeyword\\t{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}\\t{}\\t{}\\tactive\\t\\\\N\\t0.00\\t0\\t0\\t2025-09-01 18:31:37.703888+00\\t2025-09-01 19:33:41.863286+00\\twhatsapp\\t\\\\N\\tcontains\\tmais informações, por favor\\t#sair\\t4\\tt\\tt\\tt\\tt\\t100\\t1000\\tDesculpe, não entendi sua mensagem.\\t0\\t{@g.us}
\.


--
-- TOC entry 4319 (class 0 OID 19689)
-- Dependencies: 337
-- Data for Name: bookings_cal; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.bookings_cal (id, "Titulo da reuniao", "Empresa", email_da_empresa, status, inicio_reuniao, fim_da_reuniao, "duração", id_evento, slug_evento, "meetingUrl", localizacao, "Nome do Participante", email_do_participante, whatsapp, created_at, updated_at, lembrete_enviado, lembrete_24h_enviado, lembrete_3h_enviado) FROM stdin;
\.


--
-- TOC entry 4321 (class 0 OID 19700)
-- Dependencies: 339
-- Data for Name: conversations; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.conversations (id, agent_id, whatsapp_connection_id, contact_phone, contact_name, status, last_message_at, message_count, metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4322 (class 0 OID 19712)
-- Dependencies: 340
-- Data for Name: folowUp24hs_mensagem; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai."folowUp24hs_mensagem" (id, whatsapp_conenections_id, tentativa_dia, tipo_mensagem, mensagem, link) FROM stdin;
\.


--
-- TOC entry 4324 (class 0 OID 19720)
-- Dependencies: 342
-- Data for Name: integrations; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.integrations (id, name, type, config, is_active, created_at, updated_at) FROM stdin;
e7403b38-c184-4943-9e19-3346e26d2e02\\tn8n\\tn8n\\t{"apiKey": null, "flowUrl": "https://n8n2webhook.jurimind.com.br/webhook/impa-ai-crm"}\\tt\\t2025-06-24 15:55:03.886934+00\\t2025-08-25 20:03:38.302+00
2525b5f6-160e-48cd-9814-2551cd3e8e26\\tEvolution API\\tevolution_api\\t{"apiKey": "c7a365a56e9b9487fd34559304a3f6c0", "apiUrl": "https://api3.jurimind.com.br"}\\tt\\t2025-06-24 15:55:03.886934+00\\t2025-08-25 22:08:20.87+00
\.


--
-- TOC entry 4325 (class 0 OID 19730)
-- Dependencies: 343
-- Data for Name: lead_folow24hs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.lead_folow24hs (id, "whatsappConection", "remoteJid", dia, updated_at) FROM stdin;
\.


--
-- TOC entry 4327 (class 0 OID 19736)
-- Dependencies: 345
-- Data for Name: messages; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.messages (id, conversation_id, agent_id, direction, content, message_type, media_url, metadata, processed_at, created_at) FROM stdin;
\.


--
-- TOC entry 4333 (class 0 OID 20268)
-- Dependencies: 351
-- Data for Name: shared_whatsapp_links; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.shared_whatsapp_links (id, connection_id, user_id, token, password_hash, salt, permissions, expires_at, max_uses, current_uses, is_active, last_accessed_at, last_accessed_ip, access_logs, created_at, updated_at) FROM stdin;
c9b852f0-32bd-46a5-8686-11f27a24f6b5\\t376df8b2-c02d-4dd2-bdbb-88c994111a7e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tbc878502b3d96c51395b587656b24a32c3829be3mf4u67nl\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t1\\t0\\tf\\t\\\\N\\t\\\\N\\t[]\\t2025-09-04 03:18:09.950465+00\\t2025-09-04 03:27:56.982678+00
42e05700-cc54-42c5-a13c-4fd909de7894\\t656de9f5-cbc3-497a-8952-fa2985ec3fac\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tffa439582685555324c7e1fc459db603e925dea9mex7cwua\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-08-29 19:05:06.372862+00\\t2025-08-29 19:05:06.372862+00
772135f1-0ebc-4d30-bfc9-693a669ff279\\t455daee8-8510-4aea-b87f-d4102c72e34c\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t30de3e206928ad8bfd52e2775c5dfe624b5bf694mf1g8lxe\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-09-01 18:24:46.86299+00\\t2025-09-01 18:24:46.86299+00
a8144f34-0099-42a9-8840-ce11a53e9b0a\\t376df8b2-c02d-4dd2-bdbb-88c994111a7e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t9a08fc7f2e292da57144fc0c31b32f0c5b6cd8c7mf4uix7d\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t1\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-09-04 03:28:02.93583+00\\t2025-09-04 03:28:02.93583+00
97e176e8-a946-44ea-95f1-0d31c8689796\\t7ab0b30d-3576-4927-9f36-85734fe6b852\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tabe1d39933644d16c87b06671e2367eeb3c9bb63mf1xod8t\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tf\\t\\\\N\\t\\\\N\\t[]\\t2025-09-02 02:32:55.574656+00\\t2025-09-02 02:34:07.159902+00
14ffeade-bde4-4831-a308-8ff1b47cb2f3\\t7ab0b30d-3576-4927-9f36-85734fe6b852\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t2996338a31b8e39ec24ab055b82e3f9ffb6f55d3mf1xqbfr\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t1\\t0\\tf\\t\\\\N\\t\\\\N\\t[]\\t2025-09-02 02:34:26.543313+00\\t2025-09-02 02:35:25.138873+00
7246099f-4bd5-4c7c-83c6-7bd65bf5c1dd\\tcda073b3-2e6a-418b-a44c-abca6a3477e3\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t646c9befbed99de6e755d0d9c4c0625567ff12b0mf2hqff9\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-09-02 11:54:24.027759+00\\t2025-09-02 11:54:24.027759+00
9dfaf243-b13d-41b5-9ecf-dda2a5efdf9f\\t7ab0b30d-3576-4927-9f36-85734fe6b852\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\te3b5c58e2c45b635d1fd228dc3c26698edf5ca46meye2z70\\t87cbaef8461185e5484c66d2b7dd83927593c4aa887ae3c336c56717d97b172d7b50b1435a8b280d0e44deb47ed44ca5136160b2574af033306ae7f46bfa463bdc5b55b6a8d1e720c9e856f3878377d9805b4b2655d9a94fa0d4641ade9a4548bbd2e69237fb5999b93a876bfd724374093b0d172e6a1baa6e0460cecb27afa5\\t0c25a11d370d4179e7d9f4e632d7ae0415de39b34647b0bb3313493d76f35986553171e97edd1e3a1302706db28b40decd378d785417dd4abf2c85e81c9bba4c\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t1\\tf\\t2025-09-02 02:33:56.897+00\\t45.235.217.54\\t[{"ip": "45.235.217.54", "timestamp": "2025-09-02T02:33:56.884Z", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 OPR/120.0.0.0 (Edition std-2)"}]\\t2025-08-30 15:01:06.362208+00\\t2025-09-02 12:00:16.552465+00
fcdc1e2b-5f35-4b7a-a627-340e649d6352\\t7ab0b30d-3576-4927-9f36-85734fe6b852\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t04afc7f1e39dabe5f2805fe7f6242053e788588cmf2hy6g2\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-09-02 12:00:25.643175+00\\t2025-09-02 12:00:25.643175+00
cfd1913f-2835-4709-a089-a898713ef2dd\\t690d7c41-4b0b-4c78-a902-b829a627f97f\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\ta14dd9c4ab09d00727178df7d3549d8c127c8eb3mf2s6fnv\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tt\\t\\\\N\\t\\\\N\\t[]\\t2025-09-02 16:46:47.002728+00\\t2025-09-02 16:46:47.002728+00
915a52d8-6634-4c3d-988c-508fd2f19459\\t376df8b2-c02d-4dd2-bdbb-88c994111a7e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\t8a30e0654e9d407d8837b0574d1c065ec2659430mf49irbu\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t\\\\N\\t0\\tf\\t\\\\N\\t\\\\N\\t[]\\t2025-09-03 17:40:01.659872+00\\t2025-09-04 02:50:32.281275+00
569909a2-5bb5-425e-b003-af436685a460\\t376df8b2-c02d-4dd2-bdbb-88c994111a7e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tfc506b5e3e72162326eca8387dfb963bfbdd3dd7mf4tx64e\\t\\\\N\\t\\\\N\\t{"stats": false, "qr_code": true, "settings": false}\\t\\\\N\\t1\\t0\\tf\\t\\\\N\\t\\\\N\\t[]\\t2025-09-04 03:11:07.993639+00\\t2025-09-04 03:17:34.995402+00
\.


--
-- TOC entry 4328 (class 0 OID 19747)
-- Dependencies: 346
-- Data for Name: system_settings; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.system_settings (id, setting_key, setting_value, category, description, is_public, requires_restart, created_at, updated_at) FROM stdin;
dff49e46-894b-4831-811a-edfd9f7ea398\\ttheme_customization_enabled\\ttrue\\ttheme\\tHabilitar personalização de tema\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-07-05 00:24:26.082368+00
0384f97a-7aa1-4992-8256-4e7259a0b38d\\tdefault_whatsapp_connections_limit\\t"1"\\tlimits\\tLimite padrão de conexões WhatsApp\\tf\\tf\\t2025-07-05 00:23:08.650997+00\\t2025-08-06 03:47:14.609702+00
2365f4d9-d5d7-4640-9f80-717d80195ea3\\tdefault_agents_limit\\t"1"\\tlimits\\tLimite padrão de agentes IA\\tf\\tf\\t2025-07-05 00:23:08.650997+00\\t2025-08-06 03:47:14.622816+00
9f6467bd-3c25-4ad0-a65e-b7e3f7bcb542\\tallow_public_registration\\t"true"\\tauth\\tPermitir registro público\\tt\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 03:47:14.631451+00
960a9987-7610-42ec-b17c-80091766738e\\tapp_version\\t"1.0.0"\\tgeneral\\tVersão da aplicação\\tt\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 03:47:14.647334+00
586ba6e6-e1ff-440b-8ad2-7f6af4ff99ca\\tallow_custom_themes\\t"true"\\ttheme\\tPermitir temas personalizados\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.655738+00
23e128d0-28e6-4182-87ed-7a007f87255f\\trequire_email_verification\\t"true"\\tauth\\tExigir verificação de email\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.66446+00
1a64a277-31d8-419f-89fd-6345c71d7157\\tsession_timeout\\t"86400"\\tauth\\tTimeout da sessão em segundos\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.673736+00
d459f322-5068-42d9-82dd-45a86180da49\\tmax_agents_per_user\\t"5"\\tagents\\tMáximo de agentes por usuário\\tf\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 03:47:14.684402+00
829b2db6-8fc5-4203-b2ce-470eb576e336\\tmax_tokens_default\\t"1000"\\tagents\\tTokens máximos padrão\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.69243+00
93b3c584-990b-4ca9-b109-6e7cc0a80692\\tcurrent_theme\\t"default"\\tappearance\\tTema atual do sistema\\tt\\tf\\t2025-07-05 00:23:08.650997+00\\t2025-08-06 03:47:14.699221+00
0c265ea5-2e8c-4853-9329-f4204c0cb97e\\ttemperature_default\\t"0.7"\\tagents\\tTemperatura padrão para novos agentes\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.70713+00
6287a7d1-406d-477a-a474-9265f87711cd\\tenable_vector_stores\\t"true"\\tintegrations\\tHabilitar vector stores\\tf\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 03:47:14.714767+00
8c476693-1d0b-40f3-8721-260aa11f2bbd\\tenable_voice_responses\\t"true"\\tintegrations\\tHabilitar respostas por voz\\tf\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 03:47:14.72248+00
9882383a-c7e6-46de-a389-6b9d99cfb0db\\tenable_image_analysis\\t"true"\\tintegrations\\tHabilitar análise de imagens\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.731847+00
6fb4bbeb-c5f2-422b-9743-371ad316130b\\tenable_audio_transcription\\t"true"\\tintegrations\\tHabilitar transcrição de áudio\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.742049+00
02e239df-29c3-4c99-8d28-b3d95b5efc0b\\twebhook_timeout\\t"30"\\twhatsapp\\tTimeout para webhooks em segundos\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.755272+00
54194db3-6e60-4a7a-a1e7-da462a59ebce\\tauto_reconnect_enabled\\t"true"\\twhatsapp\\tHabilitar reconexão automática\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.766649+00
fd955e7f-6871-40d3-b265-d3a4cfc69640\\tdefault_theme\\t"light"\\ttheme\\tTema padrão do sistema\\tt\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.777565+00
6eaa5ead-8003-416f-ab12-32c9c08cebe0\\tavailable_llm_providers\\t"openai,anthropic,google,ollama,groq"\\tagents\\tProvedores de LLM disponíveis para criação de agentes\\tf\\tf\\t2025-07-11 06:12:24.712425+00\\t2025-08-06 03:47:14.787292+00
09140303-5e49-4304-9df0-0e8d0972d81a\\tmax_connections_per_user\\t"1"\\twhatsapp\\tMáximo de conexões WhatsApp por usuário\\tf\\tf\\t2025-07-05 00:24:26.082368+00\\t2025-08-06 03:47:14.797575+00
980a2314-f8e8-42da-832a-3c54016128bb\\tsystem_name\\t"Impa AI"\\tgeneral\\tNome do sistema\\tt\\tf\\t2025-07-05 00:23:08.650997+00\\t2025-08-06 03:47:14.806337+00
e7a7adbf-22f7-40ae-a465-1de87958a850\\tdefault_model\\t{"groq": "llama3-8b-8192", "google": "gemini-1.6-flash", "ollama": "llama3.2:3b", "openai": "gpt-4o-mini", "anthropic": "claude-3-haiku-20240307"}\\tagents\\tModelo padrão\\tf\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-06 04:33:08.320235+00
a1ea147c-4dc2-4c20-8b6d-638559e5dc5f\\tapp_name\\t"Jurimind Ai AI"\\tgeneral\\tNome da aplicação\\tt\\tf\\t2025-06-24 15:55:03.886934+00\\t2025-08-23 05:18:43.878252+00
dace15e9-c2f7-4235-ba3c-51bd63370d5e\\tfooter_text\\t"© 2025 Jurimind AI - Desenvolvido pela Impa"\\tinterface\\tTexto personalizado do rodapé das páginas públicas\\tf\\tf\\t2025-08-06 04:32:02.744151+00\\t2025-08-23 05:19:12.340835+00
ab780800-aa77-49eb-82f5-fc24730af78a\\tlanding_page_enabled\\t"true"\\tinterface\\tControla se a landing page está ativa ou se deve mostrar login direto\\tf\\tf\\t2025-08-06 03:24:02.366463+00\\t2025-08-25 19:18:29.663426+00
\.


--
-- TOC entry 4329 (class 0 OID 19758)
-- Dependencies: 347
-- Data for Name: system_themes; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.system_themes (id, name, display_name, description, colors, fonts, borders, logo_icon, is_default, is_active, created_at, updated_at) FROM stdin;
00ba4e68-3341-4901-9d9a-aa54e4b6e6a7\\tjurimind_ai\\tJurimind Ai\\tSistema Completo de\\\\r\\\\nAgentes Inteligentes\\t{"accent": "#8b5cf6", "primary": "#3b82f6", "secondary": "#10b981"}\\t{"primary": "Inter, sans-serif"}\\t{"radius": "0.5rem"}\\t🤖\\tt\\tt\\t2025-07-05 00:23:08.650997+00\\t2025-07-05 00:23:08.650997+00
\.


--
-- TOC entry 4330 (class 0 OID 19771)
-- Dependencies: 348
-- Data for Name: user_api_keys; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.user_api_keys (id, user_id, api_key, name, description, permissions, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at, access_scope, is_admin_key, allowed_ips, usage_count) FROM stdin;
46ff6b17-61f8-4617-ac4a-70689cb8f362\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\timpaai_nthJAAS6ZysA9GH0DrZQveGV47vlyYhp\\tdfsdfss\\tAPI Key para integração com sistemas externos\\t["read"]\\t100\\tt\\t2025-07-02 02:43:25.794+00\\t\\\\N\\t2025-07-02 02:38:24.960124+00\\t2025-07-02 02:43:25.836499+00\\tuser\\tf\\t[]\\t0
a60ecf2e-2a39-4233-b17b-6d562138dd91\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\timpaai_vCAbd5gF6OPJtUl46FplBAXfAD7dPn9C\\tChave\\tAPI Key para integração com sistemas externos\\t["read"]\\t100\\tt\\t2025-08-23 01:23:32.82+00\\t\\\\N\\t2025-07-02 02:33:06.058548+00\\t2025-08-23 01:23:32.844565+00\\tuser\\tf\\t[]\\t0
0d9e0b91-5eae-4c9d-a608-cc5ed7c2752e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\timpaai_eXuHj539IPwGltpMYq0Kgv99GQWsaO8v\\tAgentesJurimind\\tAPI Key para integração com sistemas externos\\t["read"]\\t100\\tt\\t2025-09-04 03:38:37.029+00\\t\\\\N\\t2025-08-25 21:23:22.593894+00\\t2025-09-04 03:38:37.041489+00\\tuser\\tf\\t[]\\t0
\.


--
-- TOC entry 4331 (class 0 OID 19788)
-- Dependencies: 349
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.user_profiles (id, full_name, email, password, role, status, avatar_url, phone, company, bio, timezone, language, api_key, email_verified, preferences, theme_settings, agents_limit, connections_limit, monthly_messages_limit, last_login_at, login_count, created_at, updated_at) FROM stdin;
d3cc26df-8192-4bbc-83c3-7ae04f77f858\\tAdministrador do Sistema\\tadmin@impa.ai\\t$2b$12$kZ3KKWKNKMH27BFAYo3szeKAhmShoP6WWEzWLOs2HwxFUSSGGzw6K\\tadmin\\tactive\\t\\\\N\\t\\\\N\\t\\\\N\\t\\\\N\\tAmerica/Sao_Paulo\\tpt-BR\\timpaai_19f7fa7d217b44d697fe86d29e93c43a\\tt\\t{}\\t{"mode": "light", "color": "blue"}\\t999\\t999\\t999999\\t2025-09-04 02:14:16.692+00\\t113\\t2025-06-16 00:20:44.792399+00\\t2025-09-04 02:14:18.335519+00
\.


--
-- TOC entry 4332 (class 0 OID 19810)
-- Dependencies: 350
-- Data for Name: whatsapp_connections; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

COPY impaai.whatsapp_connections (id, user_id, connection_name, instance_name, instance_id, instance_token, phone_number, status, qr_code, qr_expires_at, webhook_url, webhook_events, settings, auto_reconnect, max_reconnect_attempts, reconnect_interval, messages_sent, messages_received, last_message_at, last_seen_at, uptime_percentage, created_at, updated_at, adciona_folow, remover_folow) FROM stdin;
455daee8-8510-4aea-b87f-d4102c72e34c\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tbreno_comercial\\timpaai_brenocomercial_2835\\t793c19d1-12de-41b1-b9b9-90e459f5b361\\t9D60F6B8-7FEF-406E-AE9F-2CB2795E4767\\t\\\\N\\tconnected\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-09-01 18:24:33.889382+00\\t2025-09-04 02:56:11.807626+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
7ab0b30d-3576-4927-9f36-85734fe6b852\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tRafael_basso\\timpaai_rafaelbasso_9054\\tbd2c22f5-6c47-4303-8074-0346d810be05\\t5ABD2C24-1596-4B89-B88D-13270EA2AA1B\\t\\\\N\\tconnecting\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-08-30 15:00:20.689327+00\\t2025-09-03 10:37:17.131416+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
690d7c41-4b0b-4c78-a902-b829a627f97f\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tjuliana_vaz\\timpaai_julianavaz_8752\\tb6889cbb-a61f-4288-be2d-171cf21e53ac\\tC27DD52F-5B63-4717-AA71-F29F19B97B1B\\t\\\\N\\tconnected\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-09-02 16:46:41.591461+00\\t2025-09-03 13:09:58.265033+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
656de9f5-cbc3-497a-8952-fa2985ec3fac\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tsantosevieira1\\timpaai_santosevieira1_5320\\tf4c64464-c025-4105-814f-50887976be4a\\t2974F56D-1367-48C7-9920-AC45A0514391\\t\\\\N\\tconnecting\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-08-29 19:05:00.964253+00\\t2025-09-03 13:11:42.138008+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
cda073b3-2e6a-418b-a44c-abca6a3477e3\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tbrocanello\\timpaai_brocanello_9209\\t855e9662-1594-458f-8f93-366fe323ff8a\\tC078E7DD-7403-42C9-B2CC-13452FA9D675\\t\\\\N\\tconnected\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-09-02 11:53:45.490108+00\\t2025-09-03 13:11:42.16033+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
376df8b2-c02d-4dd2-bdbb-88c994111a7e\\td3cc26df-8192-4bbc-83c3-7ae04f77f858\\tteste\\timpaai_teste_9755\\tf31494b4-26ac-4426-9f06-edada47a35e0\\t84F3E896-6539-4FC3-A787-F9DDA73EBBAE\\t\\\\N\\tdisconnected\\t\\\\N\\t\\\\N\\t\\\\N\\t["message"]\\t{}\\tt\\t5\\t30\\t0\\t0\\t\\\\N\\t\\\\N\\t0.00\\t2025-09-03 17:39:43.627995+00\\t2025-09-04 03:57:19.184147+00\\tGostaria de auxilio, algo mais?\\tAgradecemos seu contato, Até Mais!
\.


--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 338
-- Name: bookings_cal_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai.bookings_cal_id_seq', 1, false);


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 341
-- Name: folowUp24hs_mensagem_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai."folowUp24hs_mensagem_id_seq"', 15, true);


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 344
-- Name: lead_folow24hs_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai.lead_folow24hs_id_seq', 40, true);


--
-- TOC entry 4050 (class 2606 OID 19844)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4054 (class 2606 OID 19846)
-- Name: agent_activity_logs agent_activity_logs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.agent_activity_logs
    ADD CONSTRAINT agent_activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4058 (class 2606 OID 19848)
-- Name: ai_agents ai_agents_evolution_bot_id_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_evolution_bot_id_key UNIQUE (evolution_bot_id);


--
-- TOC entry 4060 (class 2606 OID 19850)
-- Name: ai_agents ai_agents_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_pkey PRIMARY KEY (id);


--
-- TOC entry 4074 (class 2606 OID 19852)
-- Name: bookings_cal bookings_cal_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.bookings_cal
    ADD CONSTRAINT bookings_cal_pkey PRIMARY KEY (id);


--
-- TOC entry 4076 (class 2606 OID 19854)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 4080 (class 2606 OID 19856)
-- Name: folowUp24hs_mensagem folowup24hs_mensagem_impaai_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai."folowUp24hs_mensagem"
    ADD CONSTRAINT folowup24hs_mensagem_impaai_pkey PRIMARY KEY (id);


--
-- TOC entry 4084 (class 2606 OID 19858)
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4086 (class 2606 OID 19860)
-- Name: integrations integrations_type_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.integrations
    ADD CONSTRAINT integrations_type_key UNIQUE (type);


--
-- TOC entry 4088 (class 2606 OID 19862)
-- Name: lead_folow24hs lead_folow24hs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.lead_folow24hs
    ADD CONSTRAINT lead_folow24hs_pkey PRIMARY KEY (id);


--
-- TOC entry 4092 (class 2606 OID 19864)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4134 (class 2606 OID 20281)
-- Name: shared_whatsapp_links shared_whatsapp_links_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.shared_whatsapp_links
    ADD CONSTRAINT shared_whatsapp_links_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 19866)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 19868)
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 4100 (class 2606 OID 19870)
-- Name: system_themes system_themes_name_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_themes
    ADD CONSTRAINT system_themes_name_key UNIQUE (name);


--
-- TOC entry 4102 (class 2606 OID 19872)
-- Name: system_themes system_themes_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_themes
    ADD CONSTRAINT system_themes_pkey PRIMARY KEY (id);


--
-- TOC entry 4136 (class 2606 OID 20283)
-- Name: shared_whatsapp_links unique_active_token; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.shared_whatsapp_links
    ADD CONSTRAINT unique_active_token UNIQUE (token);


--
-- TOC entry 4109 (class 2606 OID 19874)
-- Name: user_api_keys user_api_keys_api_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_api_key_key UNIQUE (api_key);


--
-- TOC entry 4111 (class 2606 OID 19876)
-- Name: user_api_keys user_api_keys_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 4117 (class 2606 OID 19878)
-- Name: user_profiles user_profiles_api_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_api_key_key UNIQUE (api_key);


--
-- TOC entry 4119 (class 2606 OID 19880)
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- TOC entry 4121 (class 2606 OID 19882)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4126 (class 2606 OID 19884)
-- Name: whatsapp_connections whatsapp_connections_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_pkey PRIMARY KEY (id);


--
-- TOC entry 4128 (class 2606 OID 19886)
-- Name: whatsapp_connections whatsapp_connections_user_id_instance_name_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_instance_name_key UNIQUE (user_id, instance_name);


--
-- TOC entry 4051 (class 1259 OID 19887)
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_activity_logs_created_at ON impaai.activity_logs USING btree (created_at);


--
-- TOC entry 4052 (class 1259 OID 19888)
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_activity_logs_user_id ON impaai.activity_logs USING btree (user_id);


--
-- TOC entry 4055 (class 1259 OID 19889)
-- Name: idx_agent_activity_logs_agent_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_agent_activity_logs_agent_id ON impaai.agent_activity_logs USING btree (agent_id);


--
-- TOC entry 4056 (class 1259 OID 19890)
-- Name: idx_agent_activity_logs_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_agent_activity_logs_created_at ON impaai.agent_activity_logs USING btree (created_at);


--
-- TOC entry 4061 (class 1259 OID 19891)
-- Name: idx_ai_agents_chatnode; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_chatnode ON impaai.ai_agents USING btree (chatnode_integration) WHERE (chatnode_integration = true);


--
-- TOC entry 4062 (class 1259 OID 19892)
-- Name: idx_ai_agents_chatnode_integration; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_chatnode_integration ON impaai.ai_agents USING btree (chatnode_integration);


--
-- TOC entry 4063 (class 1259 OID 19893)
-- Name: idx_ai_agents_default_per_connection; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE UNIQUE INDEX idx_ai_agents_default_per_connection ON impaai.ai_agents USING btree (whatsapp_connection_id) WHERE (is_default = true);


--
-- TOC entry 4064 (class 1259 OID 19894)
-- Name: idx_ai_agents_evolution_bot_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_evolution_bot_id ON impaai.ai_agents USING btree (evolution_bot_id);


--
-- TOC entry 4065 (class 1259 OID 19895)
-- Name: idx_ai_agents_orimon; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_orimon ON impaai.ai_agents USING btree (orimon_integration) WHERE (orimon_integration = true);


--
-- TOC entry 4066 (class 1259 OID 19896)
-- Name: idx_ai_agents_orimon_integration; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_orimon_integration ON impaai.ai_agents USING btree (orimon_integration);


--
-- TOC entry 4067 (class 1259 OID 19897)
-- Name: idx_ai_agents_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_status ON impaai.ai_agents USING btree (status);


--
-- TOC entry 4068 (class 1259 OID 19898)
-- Name: idx_ai_agents_trigger_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_trigger_type ON impaai.ai_agents USING btree (trigger_type);


--
-- TOC entry 4069 (class 1259 OID 19899)
-- Name: idx_ai_agents_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_type ON impaai.ai_agents USING btree (type);


--
-- TOC entry 4070 (class 1259 OID 19900)
-- Name: idx_ai_agents_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_user_id ON impaai.ai_agents USING btree (user_id);


--
-- TOC entry 4071 (class 1259 OID 19901)
-- Name: idx_ai_agents_voice_enabled; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_voice_enabled ON impaai.ai_agents USING btree (voice_response_enabled) WHERE (voice_response_enabled = true);


--
-- TOC entry 4072 (class 1259 OID 19902)
-- Name: idx_ai_agents_whatsapp_connection; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_whatsapp_connection ON impaai.ai_agents USING btree (whatsapp_connection_id);


--
-- TOC entry 4077 (class 1259 OID 19903)
-- Name: idx_conversations_agent_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_conversations_agent_id ON impaai.conversations USING btree (agent_id);


--
-- TOC entry 4078 (class 1259 OID 19904)
-- Name: idx_conversations_contact_phone; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_conversations_contact_phone ON impaai.conversations USING btree (contact_phone);


--
-- TOC entry 4081 (class 1259 OID 19905)
-- Name: idx_integrations_active; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_integrations_active ON impaai.integrations USING btree (is_active);


--
-- TOC entry 4082 (class 1259 OID 19906)
-- Name: idx_integrations_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_integrations_type ON impaai.integrations USING btree (type);


--
-- TOC entry 4089 (class 1259 OID 19907)
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_messages_conversation_id ON impaai.messages USING btree (conversation_id);


--
-- TOC entry 4090 (class 1259 OID 19908)
-- Name: idx_messages_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_messages_created_at ON impaai.messages USING btree (created_at);


--
-- TOC entry 4129 (class 1259 OID 20294)
-- Name: idx_shared_links_connection_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_shared_links_connection_id ON impaai.shared_whatsapp_links USING btree (connection_id);


--
-- TOC entry 4130 (class 1259 OID 20297)
-- Name: idx_shared_links_expires_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_shared_links_expires_at ON impaai.shared_whatsapp_links USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- TOC entry 4131 (class 1259 OID 20296)
-- Name: idx_shared_links_token; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_shared_links_token ON impaai.shared_whatsapp_links USING btree (token) WHERE (is_active = true);


--
-- TOC entry 4132 (class 1259 OID 20295)
-- Name: idx_shared_links_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_shared_links_user_id ON impaai.shared_whatsapp_links USING btree (user_id);


--
-- TOC entry 4093 (class 1259 OID 19909)
-- Name: idx_system_settings_category; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_system_settings_category ON impaai.system_settings USING btree (category);


--
-- TOC entry 4094 (class 1259 OID 19910)
-- Name: idx_system_settings_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_system_settings_key ON impaai.system_settings USING btree (setting_key);


--
-- TOC entry 4103 (class 1259 OID 19911)
-- Name: idx_user_api_keys_access_scope; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_access_scope ON impaai.user_api_keys USING btree (access_scope);


--
-- TOC entry 4104 (class 1259 OID 19912)
-- Name: idx_user_api_keys_active; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_active ON impaai.user_api_keys USING btree (is_active) WHERE (is_active = true);


--
-- TOC entry 4105 (class 1259 OID 19913)
-- Name: idx_user_api_keys_admin; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_admin ON impaai.user_api_keys USING btree (is_admin_key) WHERE (is_admin_key = true);


--
-- TOC entry 4106 (class 1259 OID 19914)
-- Name: idx_user_api_keys_api_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_api_key ON impaai.user_api_keys USING btree (api_key);


--
-- TOC entry 4107 (class 1259 OID 19915)
-- Name: idx_user_api_keys_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_user_id ON impaai.user_api_keys USING btree (user_id);


--
-- TOC entry 4112 (class 1259 OID 19916)
-- Name: idx_user_profiles_api_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_api_key ON impaai.user_profiles USING btree (api_key) WHERE (api_key IS NOT NULL);


--
-- TOC entry 4113 (class 1259 OID 19917)
-- Name: idx_user_profiles_email; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_email ON impaai.user_profiles USING btree (email);


--
-- TOC entry 4114 (class 1259 OID 19918)
-- Name: idx_user_profiles_role; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_role ON impaai.user_profiles USING btree (role);


--
-- TOC entry 4115 (class 1259 OID 19919)
-- Name: idx_user_profiles_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_status ON impaai.user_profiles USING btree (status);


--
-- TOC entry 4122 (class 1259 OID 19920)
-- Name: idx_whatsapp_connections_instance; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_instance ON impaai.whatsapp_connections USING btree (instance_name);


--
-- TOC entry 4123 (class 1259 OID 19921)
-- Name: idx_whatsapp_connections_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_status ON impaai.whatsapp_connections USING btree (status);


--
-- TOC entry 4124 (class 1259 OID 19922)
-- Name: idx_whatsapp_connections_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_user_id ON impaai.whatsapp_connections USING btree (user_id);


--
-- TOC entry 4157 (class 2620 OID 20299)
-- Name: shared_whatsapp_links trigger_update_shared_links_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER trigger_update_shared_links_updated_at BEFORE UPDATE ON impaai.shared_whatsapp_links FOR EACH ROW EXECUTE FUNCTION impaai.update_shared_links_updated_at();


--
-- TOC entry 4151 (class 2620 OID 19923)
-- Name: ai_agents update_ai_agents_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON impaai.ai_agents FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4152 (class 2620 OID 19924)
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON impaai.conversations FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4153 (class 2620 OID 19925)
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON impaai.system_settings FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4154 (class 2620 OID 19926)
-- Name: user_api_keys update_user_api_keys_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON impaai.user_api_keys FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4155 (class 2620 OID 19927)
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON impaai.user_profiles FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4156 (class 2620 OID 19928)
-- Name: whatsapp_connections update_whatsapp_connections_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON impaai.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 4137 (class 2606 OID 19929)
-- Name: activity_logs activity_logs_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.activity_logs
    ADD CONSTRAINT activity_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE SET NULL;


--
-- TOC entry 4138 (class 2606 OID 19934)
-- Name: agent_activity_logs agent_activity_logs_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.agent_activity_logs
    ADD CONSTRAINT agent_activity_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE CASCADE;


--
-- TOC entry 4139 (class 2606 OID 19939)
-- Name: ai_agents ai_agents_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4140 (class 2606 OID 19944)
-- Name: ai_agents ai_agents_whatsapp_connection_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_whatsapp_connection_id_fkey FOREIGN KEY (whatsapp_connection_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL;


--
-- TOC entry 4141 (class 2606 OID 19949)
-- Name: conversations conversations_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE CASCADE;


--
-- TOC entry 4142 (class 2606 OID 19954)
-- Name: conversations conversations_whatsapp_connection_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_whatsapp_connection_id_fkey FOREIGN KEY (whatsapp_connection_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL;


--
-- TOC entry 4143 (class 2606 OID 19959)
-- Name: folowUp24hs_mensagem folowup24hs_mensagem_impaai_whatsapp_conenections_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai."folowUp24hs_mensagem"
    ADD CONSTRAINT folowup24hs_mensagem_impaai_whatsapp_conenections_id_fkey FOREIGN KEY (whatsapp_conenections_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE;


--
-- TOC entry 4144 (class 2606 OID 19964)
-- Name: lead_folow24hs lead_folow24hs_whatsappconection_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.lead_folow24hs
    ADD CONSTRAINT lead_folow24hs_whatsappconection_fkey FOREIGN KEY ("whatsappConection") REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE;


--
-- TOC entry 4145 (class 2606 OID 19969)
-- Name: messages messages_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE SET NULL;


--
-- TOC entry 4146 (class 2606 OID 19974)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES impaai.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 4149 (class 2606 OID 20284)
-- Name: shared_whatsapp_links shared_whatsapp_links_connection_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.shared_whatsapp_links
    ADD CONSTRAINT shared_whatsapp_links_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE;


--
-- TOC entry 4150 (class 2606 OID 20289)
-- Name: shared_whatsapp_links shared_whatsapp_links_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.shared_whatsapp_links
    ADD CONSTRAINT shared_whatsapp_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4147 (class 2606 OID 19979)
-- Name: user_api_keys user_api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4148 (class 2606 OID 19984)
-- Name: whatsapp_connections whatsapp_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4308 (class 3256 OID 19989)
-- Name: bookings_cal Anon full access bookings_cal; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Anon full access bookings_cal" ON impaai.bookings_cal TO anon USING (true) WITH CHECK (true);


--
-- TOC entry 4309 (class 3256 OID 19990)
-- Name: integrations Public read access to integrations; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to integrations" ON impaai.integrations FOR SELECT USING (true);


--
-- TOC entry 4310 (class 3256 OID 19991)
-- Name: system_settings Public read access to system settings; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to system settings" ON impaai.system_settings FOR SELECT USING ((is_public = true));


--
-- TOC entry 4311 (class 3256 OID 19992)
-- Name: system_themes Public read access to system themes; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to system themes" ON impaai.system_themes FOR SELECT USING (true);


--
-- TOC entry 4313 (class 3256 OID 20493)
-- Name: shared_whatsapp_links anon_access_active_links; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY anon_access_active_links ON impaai.shared_whatsapp_links FOR SELECT TO anon USING (((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((max_uses IS NULL) OR (current_uses < max_uses))));


--
-- TOC entry 4314 (class 3256 OID 20494)
-- Name: shared_whatsapp_links anon_update_counters; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY anon_update_counters ON impaai.shared_whatsapp_links FOR UPDATE TO anon USING (((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now()))));


--
-- TOC entry 4312 (class 3256 OID 20492)
-- Name: shared_whatsapp_links authenticated_full_access; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY authenticated_full_access ON impaai.shared_whatsapp_links TO authenticated USING (true) WITH CHECK (true);


--
-- TOC entry 4307 (class 0 OID 19689)
-- Dependencies: 337
-- Name: bookings_cal; Type: ROW SECURITY; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE impaai.bookings_cal ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 58
-- Name: SCHEMA impaai; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA impaai TO anon;
GRANT USAGE ON SCHEMA impaai TO authenticated;


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 677
-- Name: FUNCTION change_user_password(p_user_id uuid, p_old_password text, p_new_password text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) TO service_role;
GRANT ALL ON FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) TO authenticated;
GRANT ALL ON FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) TO anon;


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 689
-- Name: FUNCTION cleanup_expired_shared_links(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.cleanup_expired_shared_links() TO anon;
GRANT ALL ON FUNCTION impaai.cleanup_expired_shared_links() TO authenticated;


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 678
-- Name: FUNCTION create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO anon;
GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO authenticated;
GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO service_role;


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 680
-- Name: FUNCTION custom_login(p_email text, p_password text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.custom_login(p_email text, p_password text) TO service_role;
GRANT ALL ON FUNCTION impaai.custom_login(p_email text, p_password text) TO authenticated;
GRANT ALL ON FUNCTION impaai.custom_login(p_email text, p_password text) TO anon;


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 681
-- Name: FUNCTION custom_register(p_email text, p_password text, p_full_name text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) TO service_role;
GRANT ALL ON FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) TO authenticated;
GRANT ALL ON FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) TO anon;


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 670
-- Name: FUNCTION generate_api_key(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.generate_api_key() TO authenticated;
GRANT ALL ON FUNCTION impaai.generate_api_key() TO anon;
GRANT ALL ON FUNCTION impaai.generate_api_key() TO service_role;


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 690
-- Name: FUNCTION generate_secure_token(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.generate_secure_token() TO anon;
GRANT ALL ON FUNCTION impaai.generate_secure_token() TO authenticated;


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 674
-- Name: FUNCTION get_active_theme(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_active_theme() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_active_theme() TO anon;
GRANT ALL ON FUNCTION impaai.get_active_theme() TO service_role;


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 675
-- Name: FUNCTION get_active_users(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_active_users() TO anon;
GRANT ALL ON FUNCTION impaai.get_active_users() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_active_users() TO service_role;


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 676
-- Name: FUNCTION get_all_api_keys(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO anon;
GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO service_role;


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 683
-- Name: FUNCTION get_all_api_keys(p_admin_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) TO anon;


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 685
-- Name: FUNCTION get_all_users(p_admin_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_users(p_admin_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_all_users(p_admin_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.get_all_users(p_admin_user_id uuid) TO anon;


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 668
-- Name: FUNCTION get_public_settings(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_public_settings() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_public_settings() TO anon;
GRANT ALL ON FUNCTION impaai.get_public_settings() TO service_role;


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 679
-- Name: FUNCTION get_user_api_key_by_key(p_api_key text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_api_key_by_key(p_api_key text) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_api_key_by_key(p_api_key text) TO authenticated;
GRANT ALL ON FUNCTION impaai.get_user_api_key_by_key(p_api_key text) TO anon;


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 686
-- Name: FUNCTION get_user_api_keys(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_api_keys(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_api_keys(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.get_user_api_keys(p_user_id uuid) TO anon;


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 687
-- Name: FUNCTION get_user_profile(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_profile(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_profile(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.get_user_profile(p_user_id uuid) TO anon;


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 682
-- Name: FUNCTION increment_api_key_usage(p_api_key text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.increment_api_key_usage(p_api_key text) TO service_role;
GRANT ALL ON FUNCTION impaai.increment_api_key_usage(p_api_key text) TO authenticated;
GRANT ALL ON FUNCTION impaai.increment_api_key_usage(p_api_key text) TO anon;


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 691
-- Name: FUNCTION increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb) TO anon;
GRANT ALL ON FUNCTION impaai.increment_shared_link_usage(link_id text, max_usage_limit integer, access_log jsonb) TO authenticated;


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 672
-- Name: FUNCTION is_public_registration_allowed(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO authenticated;
GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO anon;
GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO service_role;


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 673
-- Name: FUNCTION is_user_admin(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.is_user_admin(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.is_user_admin(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.is_user_admin(p_user_id uuid) TO anon;


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 684
-- Name: FUNCTION update_connection_sync(connection_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO anon;
GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO service_role;


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 671
-- Name: FUNCTION update_shared_links_updated_at(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_shared_links_updated_at() TO anon;
GRANT ALL ON FUNCTION impaai.update_shared_links_updated_at() TO authenticated;


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 669
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO service_role;


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 688
-- Name: FUNCTION update_user_profile(p_user_id uuid, p_updates json); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) TO service_role;
GRANT ALL ON FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) TO authenticated;
GRANT ALL ON FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) TO anon;


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 334
-- Name: TABLE activity_logs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO service_role;


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 335
-- Name: TABLE agent_activity_logs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO service_role;


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 336
-- Name: TABLE ai_agents; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO service_role;


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 337
-- Name: TABLE bookings_cal; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.bookings_cal TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai.bookings_cal TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.bookings_cal TO service_role;


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 338
-- Name: SEQUENCE bookings_cal_id_seq; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai.bookings_cal_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE impaai.bookings_cal_id_seq TO authenticated;


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 339
-- Name: TABLE conversations; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO service_role;


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 340
-- Name: TABLE "folowUp24hs_mensagem"; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO authenticated;


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 341
-- Name: SEQUENCE "folowUp24hs_mensagem_id_seq"; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai."folowUp24hs_mensagem_id_seq" TO service_role;
GRANT SELECT,USAGE ON SEQUENCE impaai."folowUp24hs_mensagem_id_seq" TO authenticated;
GRANT SELECT ON SEQUENCE impaai."folowUp24hs_mensagem_id_seq" TO anon;


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 342
-- Name: TABLE integrations; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO service_role;


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE lead_folow24hs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.lead_folow24hs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.lead_folow24hs TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai.lead_folow24hs TO authenticated;


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 344
-- Name: SEQUENCE lead_folow24hs_id_seq; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai.lead_folow24hs_id_seq TO service_role;
GRANT SELECT,USAGE ON SEQUENCE impaai.lead_folow24hs_id_seq TO authenticated;
GRANT SELECT ON SEQUENCE impaai.lead_folow24hs_id_seq TO anon;


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 345
-- Name: TABLE messages; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO service_role;


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 351
-- Name: TABLE shared_whatsapp_links; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.shared_whatsapp_links TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.shared_whatsapp_links TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.shared_whatsapp_links TO service_role;


--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE system_settings; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO service_role;


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE system_themes; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO service_role;


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE user_api_keys; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO service_role;


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 349
-- Name: TABLE user_profiles; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO service_role;


--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 350
-- Name: TABLE whatsapp_connections; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO service_role;


--
-- TOC entry 2724 (class 826 OID 19993)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,USAGE ON SEQUENCES TO authenticated;


--
-- TOC entry 2722 (class 826 OID 19994)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT ALL ON FUNCTIONS TO authenticated;


--
-- TOC entry 2723 (class 826 OID 19995)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO service_role;


-- Completed on 2025-09-04 01:03:45

--
-- PostgreSQL database dump complete
--


