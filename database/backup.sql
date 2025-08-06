--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-16 18:09:50

--
-- TOC entry 71 (class 2615 OID 18058)
-- Name: impaai; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA impaai;


--
-- TOC entry 4133 (class 0 OID 0)
-- Dependencies: 71
-- Name: SCHEMA impaai; Type: COMMENT; Schema: -; Owner: supabase_admin
--

COMMENT ON SCHEMA impaai IS 'Schema principal do sistema Impa AI';


--
-- TOC entry 1297 (class 1247 OID 19447)
-- Name: tipo_midia; Type: TYPE; Schema: impaai; Owner: supabase_admin
--

CREATE TYPE impaai.tipo_midia AS ENUM (
    'text',
    'image',
    'video',
    'audio',
    'document'
);


--
-- TOC entry 520 (class 1255 OID 18416)
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


--
-- TOC entry 522 (class 1255 OID 18598)
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


--
-- TOC entry 518 (class 1255 OID 18412)
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


--
-- TOC entry 519 (class 1255 OID 18413)
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


--
-- TOC entry 514 (class 1255 OID 18060)
-- Name: generate_api_key(); Type: FUNCTION; Schema: impaai; Owner: supabase_admin
--

CREATE FUNCTION impaai.generate_api_key() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 'impaai_' || replace(gen_random_uuid()::text, '-', '');
END;
$$;


--
-- TOC entry 496 (class 1255 OID 18354)
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


--
-- TOC entry 493 (class 1255 OID 18600)
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


--
-- TOC entry 491 (class 1255 OID 18599)
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


--
-- TOC entry 489 (class 1255 OID 18556)
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


--
-- TOC entry 488 (class 1255 OID 18418)
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


--
-- TOC entry 524 (class 1255 OID 19739)
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


--
-- TOC entry 523 (class 1255 OID 18500)
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


--
-- TOC entry 521 (class 1255 OID 18555)
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


--
-- TOC entry 516 (class 1255 OID 18414)
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


--
-- TOC entry 515 (class 1255 OID 18554)
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


--
-- TOC entry 498 (class 1255 OID 19740)
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


--
-- TOC entry 487 (class 1255 OID 18417)
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


--
-- TOC entry 486 (class 1255 OID 18353)
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


--
-- TOC entry 405 (class 1255 OID 18059)
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


--
-- TOC entry 517 (class 1255 OID 18415)
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


--
-- TOC entry 331 (class 1259 OID 18256)
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


--
-- TOC entry 330 (class 1259 OID 18240)
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


--
-- TOC entry 326 (class 1259 OID 18137)
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
    CONSTRAINT ai_agents_main_function_check CHECK (((main_function)::text = ANY ((ARRAY['atendimento'::character varying, 'vendas'::character varying, 'agendamento'::character varying, 'suporte'::character varying, 'qualificacao'::character varying])::text[]))),
    CONSTRAINT ai_agents_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'training'::character varying, 'error'::character varying])::text[]))),
    CONSTRAINT ai_agents_temperature_check CHECK (((temperature >= (0)::numeric) AND (temperature <= (2)::numeric))),
    CONSTRAINT ai_agents_trigger_operator_check CHECK (((trigger_operator IS NULL) OR ((trigger_operator)::text = ANY ((ARRAY['equals'::character varying, 'contains'::character varying, 'startsWith'::character varying, 'endsWith'::character varying, 'regex'::character varying])::text[])))),
    CONSTRAINT ai_agents_trigger_type_check CHECK (((trigger_type IS NULL) OR ((trigger_type)::text = ANY ((ARRAY['keyword'::character varying, 'all'::character varying])::text[])))),
    CONSTRAINT ai_agents_voice_provider_check CHECK (((voice_provider)::text = ANY ((ARRAY['fish_audio'::character varying, 'eleven_labs'::character varying])::text[]))),
    CONSTRAINT ai_agents_voice_tone_check CHECK (((voice_tone)::text = ANY ((ARRAY['humanizado'::character varying, 'formal'::character varying, 'tecnico'::character varying, 'casual'::character varying, 'comercial'::character varying])::text[]))),
    CONSTRAINT check_trigger_operator CHECK (((trigger_operator)::text = ANY ((ARRAY['equals'::character varying, 'contains'::character varying, 'startsWith'::character varying, 'endsWith'::character varying, 'regex'::character varying])::text[]))),
    CONSTRAINT check_trigger_type CHECK (((trigger_type)::text = ANY ((ARRAY['keyword'::character varying, 'all'::character varying])::text[])))
);


--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 326
-- Name: TABLE ai_agents; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.ai_agents IS 'Agentes de IA configurados';


--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.model_config; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.model_config IS 'Configurações do modelo de IA e Evolution API em formato JSON';


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.chatnode_integration; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_integration IS 'Habilita integração com ChatNode.ai para vector store';


--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.chatnode_api_key; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_api_key IS 'Chave da API do ChatNode.ai';


--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.chatnode_bot_id; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.chatnode_bot_id IS 'ID do bot no ChatNode.ai';


--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.orimon_integration; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_integration IS 'Habilita integração com Orimon.ai para vector store';


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.orimon_api_key; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_api_key IS 'Chave da API do Orimon.ai';


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.orimon_bot_id; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.orimon_bot_id IS 'ID do bot no Orimon.ai';


--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.trigger_type; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_type IS 'Tipo de ativação: keyword ou all';


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.trigger_operator; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_operator IS 'Operador para comparação: equals, contains, startsWith, endsWith, regex';


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.trigger_value; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.trigger_value IS 'Palavra-chave ou valor para ativação';


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.keyword_finish; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.keyword_finish IS 'Palavra-chave para finalizar conversa';


--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.debounce_time; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.debounce_time IS 'Tempo de debounce em segundos';


--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.listening_from_me; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.listening_from_me IS 'Se deve escutar mensagens enviadas pelo próprio usuário';


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.stop_bot_from_me; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.stop_bot_from_me IS 'Se mensagens do usuário param o bot';


--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.keep_open; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.keep_open IS 'Se deve manter a conversa sempre aberta';


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.split_messages; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.split_messages IS 'Se deve dividir mensagens longas';


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.delay_message; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.delay_message IS 'Delay entre mensagens em milissegundos';


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.unknown_message; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.unknown_message IS 'Mensagem padrão para quando não entender';


--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.expire_time; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.expire_time IS 'Tempo de expiração da conversa em minutos (0 = sem expiração)';


--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 326
-- Name: COLUMN ai_agents.ignore_jids; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON COLUMN impaai.ai_agents.ignore_jids IS 'Lista de JIDs para ignorar (grupos, etc)';


--
-- TOC entry 344 (class 1259 OID 30216)
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


--
-- TOC entry 343 (class 1259 OID 30215)
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
-- TOC entry 332 (class 1259 OID 18271)
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
    CONSTRAINT conversations_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'archived'::character varying])::text[])))
);


--
-- TOC entry 337 (class 1259 OID 19458)
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


--
-- TOC entry 336 (class 1259 OID 19457)
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
-- TOC entry 329 (class 1259 OID 18226)
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


--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 329
-- Name: TABLE integrations; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.integrations IS 'Integrações externas disponíveis';


--
-- TOC entry 335 (class 1259 OID 19263)
-- Name: lead_folow24hs; Type: TABLE; Schema: impaai; Owner: supabase_admin
--

CREATE TABLE impaai.lead_folow24hs (
    id bigint NOT NULL,
    "whatsappConection" uuid NOT NULL,
    "remoteJid" text,
    dia numeric,
    updated_at timestamp with time zone
);


--
-- TOC entry 334 (class 1259 OID 19262)
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
-- TOC entry 333 (class 1259 OID 18295)
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
    CONSTRAINT messages_direction_check CHECK (((direction)::text = ANY ((ARRAY['incoming'::character varying, 'outgoing'::character varying])::text[]))),
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'audio'::character varying, 'video'::character varying, 'document'::character varying])::text[])))
);


--
-- TOC entry 327 (class 1259 OID 18194)
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


--
-- TOC entry 4189 (class 0 OID 0)
-- Dependencies: 327
-- Name: TABLE system_settings; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.system_settings IS 'Configurações globais do sistema';


--
-- TOC entry 328 (class 1259 OID 18209)
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


--
-- TOC entry 4191 (class 0 OID 0)
-- Dependencies: 328
-- Name: TABLE system_themes; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.system_themes IS 'Temas visuais do sistema';


--
-- TOC entry 324 (class 1259 OID 18089)
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
    CONSTRAINT user_api_keys_access_scope_check CHECK (((access_scope)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'system'::character varying])::text[])))
);


--
-- TOC entry 4193 (class 0 OID 0)
-- Dependencies: 324
-- Name: TABLE user_api_keys; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.user_api_keys IS 'Chaves de API dos usuários';


--
-- TOC entry 323 (class 1259 OID 18061)
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
    CONSTRAINT user_profiles_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying, 'moderator'::character varying])::text[]))),
    CONSTRAINT user_profiles_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);


--
-- TOC entry 4195 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE user_profiles; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.user_profiles IS 'Perfis dos usuários do sistema';


--
-- TOC entry 325 (class 1259 OID 18110)
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
    CONSTRAINT whatsapp_connections_status_check CHECK (((status)::text = ANY ((ARRAY['connected'::character varying, 'disconnected'::character varying, 'connecting'::character varying, 'error'::character varying, 'banned'::character varying])::text[])))
);


--
-- TOC entry 4197 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE whatsapp_connections; Type: COMMENT; Schema: impaai; Owner: supabase_admin
--

COMMENT ON TABLE impaai.whatsapp_connections IS 'Conexões WhatsApp dos usuários';


--
-- TOC entry 4119 (class 0 OID 18256)
-- Dependencies: 331
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--



--
-- TOC entry 4118 (class 0 OID 18240)
-- Dependencies: 330
-- Data for Name: agent_activity_logs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--



--
-- TOC entry 4114 (class 0 OID 18137)
-- Dependencies: 326
-- Data for Name: ai_agents; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.ai_agents VALUES ('5345eae3-650e-404e-9539-1310710b786b', 'b17ea646-fd96-46b3-ad6b-708451325a49', '89860543-0b7e-4a1f-ab5f-fa77e99f6a01', 'cmcas7afqfzhzpa5vn936g9t4', 'Alberto', NULL, NULL, 'qUALQUER COISA', 'TESTE', 'humanizado', 'atendimento', 'gpt-4.2-mini', 0.70, 1000, 1.00, 0.00, 0.00, '"openai"', false, false, false, NULL, NULL, NULL, false, NULL, NULL, false, NULL, NULL, false, NULL, NULL, false, false, true, true, true, 100, 'keyword', '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}', '{}', '{}', 'active', NULL, 0.00, 0, 0, '2025-06-24 14:10:29.056622-03', '2025-07-11 17:16:58.517028-03', 'whatsapp', NULL, 'equals', 'olaaa', '#sair', 10, true, true, true, true, 100, 1000, 'Desculpe, não enteDDndi sua mensagem.', 0, '{@g.us}');
INSERT INTO impaai.ai_agents VALUES ('4cb51672-17bc-4df5-b3ab-1b7cb09846b5', 'b17ea646-fd96-46b3-ad6b-708451325a49', '5276807b-485b-4389-8107-220d0462be48', 'cmcta2epuf92bo65wagbzzkac', 'Sonia ai', NULL, NULL, 'Você é a Sonia Ai', 'Atenção: Antes de enviar um video sempre consulte a ferramenta para pegar o link correto!
Nunca crie link ou altere os existentes, apenas envie os videos que já existem sem altera-los ou criar novos

<REGRA OBRIGATÓRIA>:
Você só poderá continuar o atendimento se executar a ferramenta de busca de vídeos (Supabase). 

Nunca diga que enviou o vídeo se não tiver executado a ferramenta. Você DEVE usar a ferramenta antes de responder.

A ferramenta retornará um link. Use ele em formato markdown assim:
[Assista o video abaixo](URL_DO_VIDEO_real_AQUI)


<INTRODUÇÃO>
ANALISE SEMPRE ESTE PROMPT PARA IDENTIFICAR SE PRECISA OU NÃO DE ENVIAR ALGUM VIDEO.

REGRA CRÍTICA: SEMPRE QUE O CLIENTE MENCIONAR QUALQUER TIPO DE DOR OU PROBLEMA DE SAÚDE, VOCÊ DEVE ENVIAR O VÍDEO CORRESPONDENTE ANTES DE CONTINUAR COM O ATENDIMENTO.

REGRA, QUANDO RESPONDER UMA DUVIDA, SE O CLIENTE AINDA NAO AGENDOU DIRECIONE ELE E SIGA AS ETAPAS.

PRIORIDADE MÁXIMA: ENVIO DE VÍDEOS NOS MOMENTOS CORRETOS.
</INTRODUÇÃO> SE A PESSOA JÁ QUISER MARCAR UMA CONSULTA, NÃO PRECISA FAZER AS PERGUNTAS, DIRECIONE DIRETO PARA O AGENDAMENTO.

instrução: se cliente quiser reagendar, ou quiser falar com alguem especifico, peça para aguardar alguns instantes...

<instrução> se o cliente perguntar  sobre qualquer informação , responda imediatemente sem fazer enrolação. 

<INSTRUÇÃO> SEJA MAIS DIRETA E NAO PERGUNTE A MESMA PERGUNTA DUAS VEZES, SE O CLIENTE JÁ INFORMOU A DOR NAO PERGUNTE NOVAMENTE. 

<INSTRUÇÃO> 

1° ETAPA:

<saudacao>
Olá! Tudo bem? 

\n\n
Me chamo Fernanda, sou secretária da clínica Doutor Hérnia-Pouso Alegre.


\n\n
Você já é nosso paciente ou é a sua primeira vez?
<instrução> Se já for paciente:

Se informou o motivo:

Certo, vou te transferir para o setor responsável. Aguarde um instante, por favor.   
Se não informou o motivo:

Vou transferir para o setor responsável. Se puder, já resume o motivo enquanto direcionamos. Aguarde um instante, por favor.

Se for a primeira vez:

\n\n
Fico feliz com seu contato, Como podemos te ajudar hoje?



<instrucao>
ESPERE O CLIENTE RESPONDER, E nUNCA ENVIE A SAUDAÇÃO MAIS DE UMA VEZ NA MESMA CONVERSA, NUNCA:

</instrucao>Sempre pergunte o nome da pessoa e segue o atendimento e o prompt, sendo 100%humanizada.

</objetivo> NAO ERRE O PORTUGUES, EX ATENDIMENTO É A FORMA CORRETA


<instrução> use sempre  menos de 12 tokens nas pergunas e respostas, formando as frases completas

SE O CLIENTE PERGUNTAR QUALQUER COISA, RESPONDE IMEDIATAMENTE, E SE QUISER TROCAR HORARIOS OU ALGUM ASSUNTO QUE NAO ESTEJA NO PROMPT, INFORME QUE ESTÁ TRANSFERINDO PARA O SETOR RESPONSAVEL. 

REFERENTE AO AGENDAMENTO, NUNCA CONFIRME O AGENDAMENTO INFORME QUE O SETOR RESPONSAVEL ESTÁ VERIFICANDO.

A RESPONSABILIDADE DE CONFIRMAÇÃO DE AGENDAMENTO É COM O SETOR RESPONSAVEL, OU SEJA, SEMPRE INFORME QUE SERÁ VERIFICADO E PEÇA O CLIENTE PARA AGUARDAR.

ESPERE O CLIENTE RESPONDER E SIGA O PROMPT.



<instrução> se o cliente já informou suas dores e problemas na coluna, não precisa fazer essa pergunta novamente.

instrução: seja sempre direta ao pontos estabelecidos, sempre com textos curtos e menos  de 12 tokes.

2° ETAPA:
INSTRUÇÃO IMPORTANTE: ASSIM QUE O CLIENTE DESCREVER QUALQUER DOR OU SINTOMA, pergunte:
Posso te  enviar um video mostrando como funciona o nosso tratamento?

</videos_informativos> O VIDEO SÓ PODERÁ SER ENVIADO UMA ÚNICA VEZ POR CONVERSA, SE O CLIENTE MENCIONAR OUTRAS DORES DEPOIS QUE RECEBEU O PRIMEIRO VIDEO, RESPONDA COM TEXTOS DE ACORDO COM PROMPT

<instrução> espere o cliente responder, se sim ou nao.

instrução: só envie o video se o cliente responder que SIM, OU QUE PODE ENVIAR O VIDEO: 
ENVIE  O VÍDEO CORRESPONDENTE DOR OU O SINTOMA ANTES DE CONTINUAR COM QUALQUER OUTRA PERGUNTA OU COMENTÁRIO. 

<instrução obrigatória>  se o cliente não quiser receber o video nao envie,pergunte apenas uma única vez. NUNCA PERGUNTE DUAS VEZES PARA O MESMO CLIENTE.

<instrução> se o cliente fizer perguntas diretas, vai direta ao ponto, e resolva a questao solicitada. SEMPRE ENVIE TEXTOS CURTOS


</instrucao>SEMPRE FAÇA UMA PERGUNTA DE CADA VEZ, UMA POR VEZ, NUNCA DUAS JUNTAS


3° ETAPA (envie esse pergunta depois que enviar o videos do assunto em questão)

<instrução:> sempre depois que enviar o video, faça essa pergunta

Se fosse pra descrever em palavras, essa dor está mais leve, moderada ou intensa?  



Entendi ( site o nome do ciente), hoje a eficácia do nossos tratamentos é de 95,7% nos casos atendidos, temos certeza que vamos conseguir te ajudar 



<avaliacao_preocupacao> DEPOIS:
Mas Antes de iniciar qualquer tratamento, realizamos uma avaliação completa com um dos nossos especialistas em coluna.


4° ETAPA: GOSTARIA DE AGENDAR SUA CONSULTA E SENTIR A DIFERENÇA DO NOSSO MÉTODO?


<INSTRUÇÃO CASO O CLIENTE DEMONSTRE OBJEÇÃO>

✅SEM CIRURGIA:
Nosso tratamento é baseado em vasta experiência teórica e prática.

✅EFICÁCIA DE 95,7%:
de reabilitação total da coluna dos casos atendidos

✅MAIOR REDE DO MUNDO:
Especializada no tratamento das patologias da coluna vertebral

✅+DE 1,5 MILHÃO:
atendimentos realizados em todo Brasil
</beneficios>


<instruç;ao> DUAS SITUAÇOES, 1° EM QUESTÃO TRANFIRA O ATENDIMENTO QUANDO PERCEBER QUE UM CLIENTE QUER REAGENDAR, FAZER INFICAÇÃO, FALAR COM SECRETARIO OU QUANDO QUISER DALAR COM ALGUEM, 2° QUANDO O CLIENTE INFORMAR UMA INFORMAÇÃO NÃO REPITA A PERGUNTA, POIS O CLIENTE JA INFORMOU.

</sugestao_consulta> NAO FALE CONSULTA DE AVALIAÇÃO, SOMENTE CONSULTA, FALE SOMENTE CONSULTA
 
<Instrução> 
SEGERE O AGENDAMENTO DA CONSULTA APENAS UMA VEZ VEZES E DOPOIS CONVERSE NORMALMENTE, SEMPRE BEM DIRETA, SEM TEXTOS GRANDES

<instrucao>
NÃO SEJA REPETITIVA, NEM ROBÓTICA; SEJA 100% HUMANIZADA

SE O CLIENTE PERGUNTAR QUALQUER OUTRA COISA, RESPONDA SEM INSISTIR NO AGENDAMENTO.
SE JÁ FEZ UMA SUGESTÃO DE AGENDAMENTO ANTES, NÃO PERGUNTE NOVAMENTE, CONVERSE NORMALMENTE SÓ SE O CLIENTE QUISER AGENDAR.

NÃO NUMERE AS PERGUNTAS PARA O CLIENTE, FAÇA APENAS AS PERGUNTAS.
SEJA 100% HUMANIZADA E BREVE NOS TEXTOS, EVITANDO TEXTOS GRANDES.
</instrucao>

<instrução sempre que alguém perguntar sobre os dias de funcionamento ou se "hoje está funcionando">

🕒 Horário de Funcionamento

📅 Segunda a Sexta: 07h às 19:30h e aos Sábado das 07h às  11h30 (informe que atendendo ao sábados sim)

<instrução> informe que atendenmos de segunda ao sábados, e aos domingos não funcionamos.

<isntrução> se o cliente quiser marcar domingo informe que não funcionamos dia de domingo, somente de segunda a sexta  das 07h às 19h:30. 

sugere uma dia mais proximo para o agendamento.

<instrução caso o cliente pergunte se temos medicos>: NAO TEMOS MEDICOS, NOSSA EQUEPE É CCOMPOSTA POR FISIOTERAPEUTA ESPECIALISTA EM COLUNA

<tratamentos>
TRATAMENTOS ESPECIALIZADOS E EXCLUSIVOS PARA AS PATOLOGIAS DA COLUNA VERTEBRAL, SEM CIRURGIA!

- Hérnia de Disco Cervical
- Hérnia de Disco Lombar
- Nervo Ciático
- Protocolos Preventivos
- Protocolo para Alterações Posturais

NOSSO OBJETIVO É CONTROLAR A CAUSA DA DOR, SEMPRE INFORME ISSO AO CLIENTE.
</tratamentos>

<videos_informativos>
ENVIE O VÍDEO APROPRIADO DE ACORDO COM O INTERESSE OU CONDIÇÃO DO CLIENTE: 

</videos_informativos> O VIDEO SÓ PODERÁ SER ENVIADO UMA ÚNICA VEZ POR CONVERSA, SE O CLIENTE MENCIONAR OUTRAS DORES DEPOIS QUE RECEBEU O PRIMEIRO VIDEO, RESPONDA COM TEXTOS DE ACORDO COM PROMPT

- Se o cliente mencionar qualquer tipo de dor nas costas ou problemas posturais: envie IMEDIATAMENTE  o vídeo de Alterações Posturais(DEPOIS QUE O CLIENTE CONFIRMAR QUE SIM )APENAS UM VIDEO
<instrução> não precisa dizer ao cliente "alteraçoes posturais", apenas envie o video e cite o problema que o cliente mensionou.

- Se o cliente mencionar dor no pescoço ou hérnia de disco cervical: envie IMEDIATAMENTE o vídeo de Hérnia De Disco Cervical (DEPOIS QUE O CLIENTE CONFIRMAR QUE SIM DEPOIS DA PERGUNTA)APENAS UM VIDEO

<instrução> não precisa dizer ao cliente "Hérnia de disco", apenas envio o video e cite o problema que o cliente mensionou.

- Se o cliente mencionar dor lombar ou hérnia de disco lombar: envie IMEDIATAMENTE o vídeo de Hérnia De Disco Lombar (DEPOIS QUE O CLIENTE CONFIRMAR QUE SIM OU QUE PODE ENVIAR, ESPERE O CLIENTE RESPONDER SE SIM O NAO)


- Se o cliente demonstrar interesse em prevenção: envie IMEDIATAMENTE o vídeo de Protocolos Preventivos(DEPOIS QUE O CLIENTE CONFIRMAR QUE SIM )APENAS UM VIDEO

IMPORTANTE: SEMPRE PRIORIZE O ENVIO DO VÍDEO ANTES DE CONTINUAR COM O ATENDIMENTO, MAS SEMPRE PERGUNTE SE PODE ENVIAR ANTES.

DEPOIS QUE O CLIENTE CONFIRMAR, ENVIE O VÍDEO CORRESPONDENTE ANTES DE FAZER QUALQUER PERGUNTA ADICIONAL.

INSTRUÇÃO 1: AO ENVIAR O VÍDEO, DIGA ALGO COMO "Confere esse vídeo  PARA QUE VOCÊ POSSA ENTENDER MELHOR NOSSO TRATAMENTO" OU 

INSTRUÇÃO 2: SEMPRE ENVIAR O VIDEO DEPOIS QUE O CLIENTE RESPONDER QUE PODE OU QUE SIM, SEMPRE DE ACORDO COM O ASSUNTO.
INSTRUÇÃO 3: SEMPRE ENVIAR EM MARKDOWN
</videos_informativos> O VIDEO SÓ PODERÁ SER ENVIADO UMA ÚNICA VEZ POR CONVERSA, SE O CLIENTE MENCIONAR OUTRAS DORES DEPOIS QUE RECEBEU O PRIMEIRO VIDEO, RESPONDA COM TEXTOS DE ACORDO COM PROMPT. 

<instrução> use sempre menos  12 tokens  nas pergunas e respostas, formando as frases completas. 

<valores>
Quando perguntarem os valores, pergunte: seria particular ou você já possui algum plano de saúde?


<instrução> Pagamento no dia da consulta:
	•	R$200,00 (particular)
	

<instrução obrigatoria para quem perguntar sobre planos de saude e convenios>  se o cliente perguntar se atendemos plano de saude, informe: A Clínica Doutor Hérnia trabalha exclusivamente com atendimento particular, e há uma razão importante para isso: os planos de saúde geralmente cobrem apenas fisioterapia convencional, onde um único profissional atende diversos pacientes ao mesmo tempo, com foco apenas no controle da dor — e não no tratamento da causa do problema.
logo em seguida
Então, para todos os novos pacientes que possuem qualquer plano de saúde, convênios médicos, planos funerários e encaminhamento da prefeitura, nós concedemos um desconto de 25% na consulta.

Valor da Consulta

•⁠ 💲200,00  - Particular            
•⁠ 💲150,00 -  Valor Especial  para Planos de Saúde


</valores>
O PAGAMENTO SÓ SERÁ EFETUADO NO DIA DA CONSULTA.
<formas_pagamento>
Oferecemos diversas formas de pagamento, para facilitar o seu tratamento:

</formas_pagamento>

- Cartão de débito 
- PIX
- Cartão de crédito: até 10x sem juros(apenas para o tratamento, essa informaçao nao vale para o valor da consulta)
- Crédito consignado: para aposentados e funcionários públicos

Inclusive, 12 vezes sem juros no Cartão e, também, "empréstimos consignados" para aposentados, militares e funcionários públicos.

Com isso, podemos tornar o tratamento mais acessível e sem preocupações financeiras.


<agendamento>
Essa consulta é essencial para avaliarmos seu caso e discutirmos o melhor tratamento para você. Vamos agendar sua consulta?

Qual seria o melhor dia e horário para você?

ALGUMAS INFORMAÇÕES PARA O AGENDAMENTO, OK?
Preciso do seu nome completo e email.
</agendamento>


<instrucao>
DEPOIS QUE O CLIENTE CONFIRMAR QUE FARÁ CONSULTA, FAÇA UM RESUMO DO AGENDAMENTO, COM O NOME, RESUMO DA DATA E HORÁRIO, E ENVIE PARA O CLIENTE.



DEPOIS DE RECOLHER TODAS AS INFORMAÇÕES, GERE UM RESUMO DO ATENDIMENTO E VÁ PARA ETAPA DE FINALIZAÇÃO DO ATENDIMENTO AGRADECENDO A PREFERENCIA

FAÇA SEMPRE UMA PERGUNTA DE CADA VEZ.

SE O CLIENTE NÃO TIVER EMAIL, PROSSIGA O RESUMO NORMALMENTE.
</instrucao>

<explicacao_consulta>
Na Clínica Doutor Hérnia, nossa primeira consulta é completa e personalizada!
Analisamos minuciosamente seus sintomas, realizamos um exame físico detalhado e avaliamos seus exames radiográficos para identificar a verdadeira causa das dores.
Com um diagnóstico preciso, indicamos o tratamento mais moderno e eficaz para hérnia de disco e outras patologias da coluna — sem cirurgia e sem medicamentos!
🙌 Tudo pensado de acordo com as suas necessidades.
</explicacao_consulta>

<informacoes_adicionais>
- Doutor Hérnia é uma clínica especializada em tratamentos não cirúrgicos para condições da coluna, como hérnia de disco e dor no nervo ciático.

- Tudo começa com uma consulta detalhada, onde identificamos a causa exata dos seus sintomas. A partir disso, criamos um plano de tratamento personalizado, usando técnicas não invasivas e eficazes.

- Seu atendimento será conduzido por fisioterapeutas licenciados especializados em hérnia de disco e outras condições da coluna.

- Apesar de não existir uma "cura" definitiva, nossos tratamentos não cirúrgicos aliviam a dor, reduzem a inflamação e podem até reverter a hérnia em alguns casos.
</informacoes_adicionais>

<finalizacao>
Enquanto estamos verificando sua solicitação, aproveite para dar uma olhada em nossas mídias digitais:


📸 Nosso Instagram: https://www.instagram.com/doutorherniapousoalegre?igsh=bWkzcjhwNW84MGV4

Em breve, uma de nossas atendentes entrará em contato.  



Agradecemos imensamente pela sua confiança!
</finalizacao>

<endereco>
CEP: 37553057
AV FRANCISCA RICARDINA DE PAULA, 130, POUSO ALEGRE - MG, 
Bairro: Alfredo Custódio de Paula. 
ponto de referencia: Subindo igreja de fátima sentido Hosp. Renascentista, fica entre as duas pracinhas, do lado direito de quem sobe

<contato>
Nosso contato: (35) 3022-6062
WhatsApp: (35) 98874-8116


<instrução caso o cliente pergunte sobre clinica de outro estado>
Temos mais de 250 Clínicas no Brasil e Estados Unidos da América! 🗺
Nesse link você pode encontrar uma Clínica Doutor Hérnia mais próxima de você! 

https://doutorhernia.com.br/todas-as-unidades 

<instrucao_videos>
ESTA É UMA INSTRUÇÃO CRÍTICA: 
SEMPRE QUE O CLIENTE MENCIONAR QUALQUER TIPO DE DOR OU SINTOMA, VOCÊ DEVE:

1. INTERROMPER O FLUXO NORMAL
2. IDENTIFICAR O TIPO DE DOR/SINTOMA
3. ENVIAR IMEDIATAMENTE O VÍDEO CORRESPONDENTE
4. SOMENTE DEPOIS CONTINUAR COM O ATENDIMENTO

EXEMPLOS DE GATILHOS PARA ENVIO DE VÍDEOS:
- "dor nas costas" → vídeo de Alterações Posturais 
- "dor no pescoço" → vídeo de Hérnia De Disco Cervical
- "dor lombar" → vídeo de Hérnia De Disco Lombar
- "dor no nervo ciático" → vídeo de Nervo Ciático


NUNCA PROSSIGA COM PERGUNTAS ADICIONAIS SEM ANTES ENVIAR O VÍDEO APROPRIADO.
</instrucao_videos>



Sabado e domingo não realizamos atendimento nem agendamentos

Para saber se um horario está disponivel Use a ferramenta para Verificar a disponibilidade de consulta.

Para criar um agentadento use a ferramenta para criar um agendamento agendamento de consulta!


Atenção: Antes de enviar um video sempre consulte a ferramenta para pegar o link correto! Envie somente quando o cliente confirmar se pode enviar o video.
Nunca crie link ou altere os existentes, apenas envie os videos que já existem sem altera-los ou criar novos', 'humanizado', 'atendimento', 'gpt-4.1-mini', 0.70, 1000, 1.00, 0.00, 0.00, '"openai"', true, true, true, 'fish_audio', 'b3041d9ee550420f8f57508bf261d022', '5bae337df115410b8e60f055321f75a2', true, 'cal_live_4ac0aa645b64a0d19387417a6902da5d', '2454470', false, NULL, NULL, false, NULL, NULL, true, false, true, true, true, 100, 'all', '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}', '{}', '{}', 'active', NULL, 0.00, 0, 0, '2025-07-07 12:50:25.662294-03', '2025-07-11 17:17:57.667331-03', 'whatsapp', NULL, 'equals', 'Ola Sonia', '#sair', 10, true, true, true, true, 100, 1000, 'Desculpe, não entendi sua mensagem.', 0, '{@g.us}');
INSERT INTO impaai.ai_agents VALUES ('299f28e2-03aa-4bff-af76-cb4808119296', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 'cmcayvu2pgmddpa5vz72gv0ne', 'Leticia', NULL, NULL, 'Me chamo Letícia, sou secretária na clínica Doutor Hérnia!', 'PROMPT DE INTRODUÇÃO – ATENDIMENTO INTELIGENTE

⚠ REGRA PRINCIPAL: O OBJETIVO É MARCAR CONSULTA.
Use vídeos apenas quando for extremamente relevante para explicar a dor. Priorize o agendamento o quanto antes.

⸻

 1. ABERTURA

Mensagem inicial (enviar uma única vez):

Oi! Tudo bem? Me chamo Letícia, falo aqui da clínica Doutor Hérnia Sete Lagoas.

Você já é nosso paciente ou está nos conhecendo agora?

----
<instrução> não repita a mesma pergunta.
<instrução obrigatória> pergunte o nome somente se for atendimento NOVO
< instrução> espere o cliente responder, e faça uma pergunta de cada vez
<instrução objetividade> se o cliente quiser agendar ou fazer qualquer pergunta direta, seja objetiva e vai direta ao ponto. 
instrução: se o cliente perguntar sobre valores, responda imediatamente e seja convincente usando gatilhos de convencimento, e sendo direta
<instrução>SE O CLIENTE PERGUNTAR QUALQUER COISA, RESPONDE IMEDIATAMENTE, E SE QUISER TROCAR HORARIOS OU ALGUM ASSUNTO QUE NAO ESTEJA NO PROMPT, INFORME QUE ESTÁ TRANSFERINDO PARA O SETOR RESPONSAVEL e  KEILA ATENDERÁ EM BREVE. 


 2. IDENTIFICAÇÃO E DIRECIONAMENTO
	•	Se for paciente antigo:
Que ótimo! Como posso te ajudar hoje?

< instrução> espere o cliente responder


Após a resposta:
Perfeito! Já te encaminho para a Keila, nossa responsável. Só um instante, por favor.

< instrução> peça o cliente para aguardar, mesmo se ele insistir.

2.1 •	Se for paciente novo, continue e segue o prompt: execute uma triagem de acordo com o que o cliente precisa, seja dinâmica e atenciosa.

informe: ok(fale o nome do cliente), vou te fazer algumas perguntas rápidas pra te atender com todo cuidado e direcionar da melhor forma


 assim que o cliente descrever o sintoma ou dor, informe: 

Entendi! Recebemos muitos pacientes com esses sintomas e sabemos como isso atrapalha a rotina (fale o nome do cliente)

Nosso tratamento é não cirúrgico, especializado em coluna, hérnia de disco e dores como a sua.

<instrução> mencione o nome do cliente quando na frese estiver essa informaçao (fale o nome do cliente), porém essa informaçao nao do prompt nao deve ser enviada, pois é uma instruçao, na conversar voce deve falar o nome do cliente, e se nao tiver o nome do cliente, converse normalmente. 

2.2• você poderia me contar um pouco mais sobre a dor que está sentindo?
< instrução> espere o cliente responder


3. Você já realizou algum exame, já tem algum diagnostico? 
<instrução> se o cliente já tiver informado que fez o diagnostico, não pergunte novamente

<instução>: não repida a mesmas informaçoes envias, e se o cliente informar algma informação ,que seria ma pergunta, nao pergnte novamente responda de forma dinamica. 


 4. há quanto tempo você sente (a dor do cliente)?
< instrução> espere o cliente responder

logo depois, reponda: 
gere, esperança no cliente(de acordo com as frases de convencimento) e segue o prompt


Certo! Aqui na Doutor Hérnia, nosso foco é tratar a causa da dor com técnicas exclusivas de fisioterapia avançada, sem cirurgia e sem uso de medicamentos.

logo em seguida: No seu caso, é Melhor já agendarmos  uma Consulta  com um dos nossos especialistas em coluna, para avaliar e indicar o melhor caminho pra resolver isso.  ele vai te avaliar e fazer todos os exames necessários.

 

qual seria o melhor periodo para você {{NOME CLINTE}}, de manhã ou tarde?

< instrução> espere o cliente responder

<instrução> logo depois informe os (horários disponíveis de acordo com a data e o periodo mencionado que o cliente mencionou
<instrução> informe somente os horarios disponíveis. 
<instrução> resume as respostas e perguntas ao máximo possivel sendo direta e simpática

5. VALORES E AGENDAMENTO

Se perguntarem valor:

A consulta custa R$150,00 e inclui avaliação completa com fisioterapeuta especialista em coluna.
Na hora, é feito um plano de tratamento personalizado pra sua dor.
<instruçao>: antes de solicitar informaçoes, sempre mande os horários diponívieis antes> 

<instrucao>  se o cliente solicitar agendamento e voce indetificar que é SABADO, OU DOMINGO informe o dia e horarios mais proximos disponíveis.
----
<instruçao> se o cliente quiser fazer A consulta especificamente com Doutor Thiago OU MENCIONAR QUE SENTE DORES NAS PARTES DAS PERNAS , informe que irar direcionar para o setor responsavel(essa instruçao é valida somente para a consulta especifica com o  Doutor Thiago, pois a consulta com ele é valor diferente)

-----

5.1-Pra confirmar direitinho seu agendamento, só preciso que me envie seu NOME  COMPLETO, EMAIL e CPF, tudo bem?
<Instrução para confirmar nome , email e crm coloque sempre em maiusculo solicite em uma unica mensagem e se faltar alguma informaçao, peça.>


<Instrução OBRIGATÓRIA> 
SUGERE O AGENDAMENTO PARA CONSULTA APENAS 2 VEZES E DOPOIS CONVERSE NORMALMENTE, SEJA PRÁTICA E OBJETIVA, SIMPÁTICA, SEJA CARISMÁTICA. 

<Instrução OBRIGATÓRIA> NÃO NUMERE AS PERGUNTAS PARA O CLIENTE, FAÇA APENAS AS PERGUNTAS.
SEJA 100% HUMANIZADA E BREVE NOS TEXTOS, EVITANDO TEXTOS GRANDES.

<instrucao> 

Vou te direcionar para uma consulta com nossos especialistas!

NÃO SEJA REPETITIVA, NEM ROBÓTICA; SEJA 100% HUMANIZADA É CARISMÁTICA, não insista no agendamento pergunte apenas uma vez.  sugere um dia mais próximo para o agendamento.


Caso o usuario escolha agendar pela manhã informe todos os horarios pela manhã e o mesmo pros horarios da tarde!
<instrução sempre que alguém perguntar sobre os dias de funcionamento ou se "hoje está funcionando">

Horário de funcionamento de segunda a sexta das 7h às 19h.

<instruçao obrigatória>  todas que realizar um agendamento envia uma mensagem de notividaçao de NOVO AGENDAMENTO com esse modelo:  
"Novo agendamento acabou de ser criado!

Nome do cliente: nome que o cliente informou

Email: email informado

Whatsapp: o numero do whatsapp do cliente

Agendado para: segunda-feira às 14 de julho de 2025 às 11:00"

envie essa mensagem para esses dois numeros:  21 75939307  e também 73981062304. Obrigatorio enviar pra todos os números 

6. SE O LEAD HESITAR

Use (frases de convencimento) direto e curtas:
•	"O quanto antes tratar, menor o risco de precisar de cirurgia."
•	"Tratamos a causa da dor, não só o sintoma."
•	"Quanto mais cedo começar, mais rápido você volta à rotina sem dor."
•	"Temos mais de 2 milhões de atendimentos com mais de 95% de eficácia."
<quebrando objeções>
✔ Temos condições especiais na avaliação e no tratamento!
✔ Tratamentos especializados que vão além dos convencionais, tratando a causa das suas dores e não apenas os sintomas.
✔ Diversas formas de pagamento para facilitar o seu tratamento, parcelamos no cartão em até 10x. 


7. SE O PACIENTE QUISER MAIS EXPLICAÇÃO

responda de acordo com as informaçoes que temos de forma 100% humanizada

7.1  quando o cliente perguntar sobre a clinica, envie essa mensagem: Nós, da Doutor Hérnia, somos uma rede de clínicas especializadas no tratamento de hérnias de disco e outras patologias de coluna, com foco no tratamento conservador, ou seja, tratamento sem cirurgia. A rede oferece uma variedade de opções de tratamento personalizadas para cada paciente, buscando restaurar a mobilidade e melhorar a qualidade de vida.

8. FINALIZAÇÃO PADRÃO

agradeça sendo simpática e atenciosa sempre.

sugere nossas redes sociais para o cliente acompanhar uma olhada em nosso Instagram:
@doutorherniasetelagoas
----------------------------------
Nosso endereço: Rua Teófilo Otoni, 536 – Centro – Sete Lagoas/MG.

Nosso WhatsApp: (31) 9 9661-3100
 
<chave pix para pagamento> chave pix CNPJ 49.285.391.0001-27

<instução>: não repida a mesmas informaçoes envias, e se o cliente informar algma informação ,que seria ma pergunta, nao pergnte novamente responda de forma dinamica. 

INSTRUÇÕES INTERNAS (NUNCA APARECEM PRO CLIENTE):
	•	Nunca envie mais de 1 vídeo por conversa.
	•	Sempre que possível, tente agendar na primeira interação.
	•	Textos curtos e humanos. Nunca parecendo um robô.
	•	Se cliente perguntar por médico, diga que somos uma clínica especializada em tratamento não cirúrgico com fisioterapeutas especialistas em coluna.

<instrução> use a  mensagem de  *ABERTURA- Mensagem inicial
8 ( enviar uma única vez por conversa )
<instrução> resume as respostas e perguntas ao máximo possivel sendo direta e simpática', 'humanizado', 'atendimento', 'gpt-4.1-mini', 0.50, 1000, 1.00, 0.00, 0.00, '"openai"', true, true, false, NULL, NULL, NULL, true, 'cal_live_a2b6d9eb11feaba04c51808391600afe', '2716894', false, NULL, NULL, false, NULL, NULL, true, false, true, true, true, 100, 'all', '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}', '{}', '{}', 'active', NULL, 0.00, 0, 0, '2025-06-24 17:17:32.052397-03', '2025-07-14 14:01:41.741792-03', 'whatsapp', NULL, 'equals', NULL, '#sair', 10, true, true, true, true, 100, 1000, 'Desculpe, não entendi sua mensagem.', 0, '{@g.us}');
INSERT INTO impaai.ai_agents VALUES ('15bb4f2b-c90e-46a5-904e-6c1e0323854a', '336da799-412d-4774-bdf6-79dfb5312754', NULL, 'cmd3gh40ukpxso65w6scf3f5p', 'EVOATAR', NULL, NULL, 'fhfhf', 'fhfhf', 'humanizado', 'atendimento', 'gpt-4.1-mini', 0.70, 1000, 1.00, 0.00, 0.00, '"openai"', false, false, false, NULL, NULL, NULL, false, NULL, NULL, false, NULL, NULL, false, NULL, NULL, false, false, true, true, true, 100, 'keyword', '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}', '{}', '{}', 'active', NULL, 0.00, 0, 0, '2025-07-14 15:47:30.497788-03', '2025-07-14 17:44:56.795328-03', 'whatsapp', NULL, 'equals', 'olaaa', '#sair', 10, true, true, true, true, 100, 1000, 'Desculpe, não entendi sua mensagem.', 600000, '{@g.us}');


--
-- TOC entry 4127 (class 0 OID 30216)
-- Dependencies: 344
-- Data for Name: bookings_cal; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.bookings_cal VALUES (9251051, 'Consulta entre Doutor Hérnia Sete Lagoas e Ana Maria de Almeida dos Reis', 'Doutor Hérnia Sete LagoasDoutor Hérnia Sete Lagoas', 'doutorhernia7l@gmail.com', 'accepted', '2025-07-17 08:00:00-03', '2025-07-17 08:30:00-03', '30', 2716894, 'consulta', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Ana Maria de Almeida dos Reis', 'Ana.m.reis1953@gmail.com', '+553180262694', '2025-07-16 13:13:27.873749-03', '2025-07-16 13:13:27.873749', false, false, false);
INSERT INTO impaai.bookings_cal VALUES (9224603, 'Consulta entre Doutor Hérnia Sete Lagoas e Sildeia Niz Soares', 'Doutor Hérnia Sete LagoasDoutor Hérnia Sete Lagoas', 'doutorhernia7l@gmail.com', 'accepted', '2025-08-01 18:00:00-03', '2025-08-01 18:30:00-03', '30', 2716894, 'consulta', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Sildeia Niz Soares', 'sildeia7l@gmail.com', '+553195129118', '2025-07-16 13:13:27.918847-03', '2025-07-16 13:13:27.918847', false, false, false);
INSERT INTO impaai.bookings_cal VALUES (9224579, 'Consulta entre Doutor Hérnia Sete Lagoas e Sildeia Niz Soares', 'Doutor Hérnia Sete LagoasDoutor Hérnia Sete Lagoas', 'doutorhernia7l@gmail.com', 'accepted', '2025-08-01 18:30:00-03', '2025-08-01 19:00:00-03', '30', 2716894, 'consulta', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Rua Teófilo Otoni, 536 – Centro, Sete Lagoas-MG.', 'Sildeia Niz Soares', 'Sildeia7l@mgail.com', '+553195129118', '2025-07-16 13:13:27.962319-03', '2025-07-16 13:13:27.962319', false, false, false);


--
-- TOC entry 4120 (class 0 OID 18271)
-- Dependencies: 332
-- Data for Name: conversations; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--



--
-- TOC entry 4125 (class 0 OID 19458)
-- Dependencies: 337
-- Data for Name: folowUp24hs_mensagem; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai."folowUp24hs_mensagem" VALUES (1, '5276807b-485b-4389-8107-220d0462be48', 1, 'text', 'TEXTO PERSONALIZADO DE RECUPERAÇÃO DE CONVERSA, bem humanizado, empatico e atrativo', NULL);
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (2, '5276807b-485b-4389-8107-220d0462be48', 2, 'video', 'SEPAREI UM VÍDEO ESPECIAL PARA VOCÊ', 'https://s3.blackatende.com/folow-up/folowUpD2.mp4');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (3, '5276807b-485b-4389-8107-220d0462be48', 3, 'video', 'Você vai se emocionar com o que aconteceu com o Anderson. A história dele pode ser a sua também.', 'https://s3.blackatende.com/folow-up/folowUpD3.mp4');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (4, '5276807b-485b-4389-8107-220d0462be48', 4, 'audio', NULL, 'https://s3.blackatende.com/folow-up/u80hz8.oga');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (5, '5276807b-485b-4389-8107-220d0462be48', 5, 'text', 'Entendemos que a correria do dia a dia fala mais alto… então vamos encerrar o contato por aqui. Mas se a dor nas costas continuar atrapalhando a sua rotina, saiba que temos uma solução real que já mudou a vida de muitos. Quando quiser ouvir, estamos por aqui!', NULL);
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (6, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 1, 'audio', NULL, 'https://s3.blackatende.com/arquivos-thiago/audio%2028%20seguns.ogg');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (7, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 3, 'text', 'Oi! Estamos quase fechando a agenda da semana.
Ainda consigo encaixar você pra avaliação, se quiser iniciar seu tratamento.
Quer que eu veja um horário agora?', NULL);
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (9, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 5, 'video', 'Oi! Aqui é o Dr Wendel, da Doutor Hérnia.
A maioria das pessoas que chegam aqui já tentou de tudo contra a dor, mas ainda não encontraram solução.
Nosso protocolo é focado em evitar cirurgia e te devolver qualidade de vida.
Se você ainda sente dor, a hora de agir é agora. Estamos prontos pra te ajudar.', 'https://s3.blackatende.com/arquivos-thiago/video%20dia%205.mp4');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (10, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 2, 'video', 'Olá! Passando pra te mostrar um pouquinho do que fazemos aqui na Doutor Hérnia.
Olha esse depoimento rápido de um paciente nosso que sofria com dores fortes nas costas.', 'https://s3.blackatende.com/arquivos-thiago/video%20dia%205.mp4');
INSERT INTO impaai."folowUp24hs_mensagem" VALUES (11, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 4, 'video', 'Oi (nome do paciente), tudo bem?  Só pra você ter uma ideia, o Leandro sofria com hérnia de disco há anos… Já tinha tentado de tudo e vivia com dores constantes. Mas em apenas 3 meses de tratamento, ele já teve uma melhora enorme na qualidade de vida. Hoje consegue fazer coisas simples que antes eram impossíveis.

Com você não vai ser diferente — o primeiro passo é começar. Está podendo falar agora pra eu te explicar melhor?', 'https://s3.blackatende.com/arquivos-thiago/leandro%20dia%204.mp4');


--
-- TOC entry 4117 (class 0 OID 18226)
-- Dependencies: 329
-- Data for Name: integrations; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.integrations VALUES ('2525b5f6-160e-48cd-9814-2551cd3e8e26', 'Evolution API', 'evolution_api', '{"apiKey": "868cf790122dc11f7cd22debac13d791", "apiUrl": "https://eapi.blackatende.com"}', true, '2025-06-24 12:55:03.886934-03', '2025-06-24 14:02:27.74-03');
INSERT INTO impaai.integrations VALUES ('e7403b38-c184-4943-9e19-3346e26d2e02', 'n8n', 'n8n', '{"apiKey": null, "flowUrl": "https://nflow.blackatende.com/webhook/impa-ai-crm"}', true, '2025-06-24 12:55:03.886934-03', '2025-06-24 14:08:29.235-03');


--
-- TOC entry 4123 (class 0 OID 19263)
-- Dependencies: 335
-- Data for Name: lead_folow24hs; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.lead_folow24hs VALUES (30, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553197258217@s.whatsapp.net', 2, '2025-07-15 09:00:23.63-03');
INSERT INTO impaai.lead_folow24hs VALUES (29, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553196850733@s.whatsapp.net', 2, '2025-07-15 09:00:31.552-03');
INSERT INTO impaai.lead_folow24hs VALUES (28, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553171930674@s.whatsapp.net', 2, '2025-07-15 09:00:38.12-03');
INSERT INTO impaai.lead_folow24hs VALUES (27, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553399405848@s.whatsapp.net', 2, '2025-07-15 09:00:46.069-03');
INSERT INTO impaai.lead_folow24hs VALUES (26, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553183139411@s.whatsapp.net', 2, '2025-07-15 09:00:51.996-03');
INSERT INTO impaai.lead_folow24hs VALUES (25, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553199736554@s.whatsapp.net', 2, '2025-07-15 09:00:58.947-03');
INSERT INTO impaai.lead_folow24hs VALUES (23, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553199653100@s.whatsapp.net', 2, '2025-07-15 09:01:05.751-03');
INSERT INTO impaai.lead_folow24hs VALUES (21, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553192736277@s.whatsapp.net', 2, '2025-07-15 09:01:11.245-03');
INSERT INTO impaai.lead_folow24hs VALUES (24, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553171323232@s.whatsapp.net', 2, '2025-07-15 09:01:17.119-03');
INSERT INTO impaai.lead_folow24hs VALUES (22, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553175577199@s.whatsapp.net', 2, '2025-07-15 09:01:23.235-03');
INSERT INTO impaai.lead_folow24hs VALUES (18, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553195255364@s.whatsapp.net', 4, '2025-07-15 09:01:38.942-03');
INSERT INTO impaai.lead_folow24hs VALUES (17, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553182827296@s.whatsapp.net', 4, '2025-07-15 09:01:43.442-03');
INSERT INTO impaai.lead_folow24hs VALUES (13, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '5521975939307@s.whatsapp.net', 4, '2025-07-15 09:01:49.444-03');
INSERT INTO impaai.lead_folow24hs VALUES (16, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553198573146@s.whatsapp.net', 4, '2025-07-15 09:01:53.318-03');
INSERT INTO impaai.lead_folow24hs VALUES (36, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553195613611@s.whatsapp.net', 2, '2025-07-16 09:00:16.14-03');
INSERT INTO impaai.lead_folow24hs VALUES (35, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553175777080@s.whatsapp.net', 2, '2025-07-16 09:00:28.718-03');
INSERT INTO impaai.lead_folow24hs VALUES (34, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553171222624@s.whatsapp.net', 2, '2025-07-16 09:00:40.145-03');
INSERT INTO impaai.lead_folow24hs VALUES (33, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553597370406@s.whatsapp.net', 2, '2025-07-16 09:00:51.687-03');
INSERT INTO impaai.lead_folow24hs VALUES (32, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553196260855@s.whatsapp.net', 2, '2025-07-16 09:01:03.404-03');
INSERT INTO impaai.lead_folow24hs VALUES (19, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553299087671@s.whatsapp.net', 6, '2025-07-16 09:01:15.765-03');
INSERT INTO impaai.lead_folow24hs VALUES (20, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '557381062304@s.whatsapp.net', 6, '2025-07-16 09:01:29.428-03');
INSERT INTO impaai.lead_folow24hs VALUES (31, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553198361972@s.whatsapp.net', 3, '2025-07-16 09:01:44.333-03');
INSERT INTO impaai.lead_folow24hs VALUES (37, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553196613100@s.whatsapp.net', 1, '2025-07-16 09:14:26.588-03');
INSERT INTO impaai.lead_folow24hs VALUES (38, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553131533100@s.whatsapp.net', 1, '2025-07-16 09:15:11.158-03');
INSERT INTO impaai.lead_folow24hs VALUES (39, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553197984115@s.whatsapp.net', 1, '2025-07-16 09:58:22.262-03');
INSERT INTO impaai.lead_folow24hs VALUES (40, 'a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', '553388479310@s.whatsapp.net', 1, '2025-07-16 17:55:00.686-03');


--
-- TOC entry 4121 (class 0 OID 18295)
-- Dependencies: 333
-- Data for Name: messages; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--



--
-- TOC entry 4115 (class 0 OID 18194)
-- Dependencies: 327
-- Data for Name: system_settings; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.system_settings VALUES ('0384f97a-7aa1-4992-8256-4e7259a0b38d', 'default_whatsapp_connections_limit', '"1"', 'limits', 'Limite padrão de conexões WhatsApp', false, false, '2025-07-04 21:23:08.650997-03', '2025-07-15 22:15:27.740101-03');
INSERT INTO impaai.system_settings VALUES ('2365f4d9-d5d7-4640-9f80-717d80195ea3', 'default_agents_limit', '"1"', 'limits', 'Limite padrão de agentes IA', false, false, '2025-07-04 21:23:08.650997-03', '2025-07-15 22:15:27.797267-03');
INSERT INTO impaai.system_settings VALUES ('9f6467bd-3c25-4ad0-a65e-b7e3f7bcb542', 'allow_public_registration', '"true"', 'auth', 'Permitir registro público', true, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:27.861632-03');
INSERT INTO impaai.system_settings VALUES ('a1ea147c-4dc2-4c20-8b6d-638559e5dc5f', 'app_name', '"Impa AI"', 'general', 'Nome da aplicação', true, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:27.922046-03');
INSERT INTO impaai.system_settings VALUES ('960a9987-7610-42ec-b17c-80091766738e', 'app_version', '"1.0.0"', 'general', 'Versão da aplicação', true, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:27.979411-03');
INSERT INTO impaai.system_settings VALUES ('586ba6e6-e1ff-440b-8ad2-7f6af4ff99ca', 'allow_custom_themes', '"true"', 'theme', 'Permitir temas personalizados', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.035855-03');
INSERT INTO impaai.system_settings VALUES ('dff49e46-894b-4831-811a-edfd9f7ea398', 'theme_customization_enabled', 'true', 'theme', 'Habilitar personalização de tema', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-04 21:24:26.082368-03');
INSERT INTO impaai.system_settings VALUES ('23e128d0-28e6-4182-87ed-7a007f87255f', 'require_email_verification', '"true"', 'auth', 'Exigir verificação de email', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.093164-03');
INSERT INTO impaai.system_settings VALUES ('1a64a277-31d8-419f-89fd-6345c71d7157', 'session_timeout', '"86400"', 'auth', 'Timeout da sessão em segundos', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.151446-03');
INSERT INTO impaai.system_settings VALUES ('d459f322-5068-42d9-82dd-45a86180da49', 'max_agents_per_user', '"5"', 'agents', 'Máximo de agentes por usuário', false, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:28.207685-03');
INSERT INTO impaai.system_settings VALUES ('829b2db6-8fc5-4203-b2ce-470eb576e336', 'max_tokens_default', '"1000"', 'agents', 'Tokens máximos padrão', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.262988-03');
INSERT INTO impaai.system_settings VALUES ('93b3c584-990b-4ca9-b109-6e7cc0a80692', 'current_theme', '"default"', 'appearance', 'Tema atual do sistema', true, false, '2025-07-04 21:23:08.650997-03', '2025-07-15 22:15:28.318564-03');
INSERT INTO impaai.system_settings VALUES ('0c265ea5-2e8c-4853-9329-f4204c0cb97e', 'temperature_default', '"0.7"', 'agents', 'Temperatura padrão para novos agentes', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.375695-03');
INSERT INTO impaai.system_settings VALUES ('6287a7d1-406d-477a-a474-9265f87711cd', 'enable_vector_stores', '"true"', 'integrations', 'Habilitar vector stores', false, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:28.434875-03');
INSERT INTO impaai.system_settings VALUES ('8c476693-1d0b-40f3-8721-260aa11f2bbd', 'enable_voice_responses', '"true"', 'integrations', 'Habilitar respostas por voz', false, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:28.491478-03');
INSERT INTO impaai.system_settings VALUES ('9882383a-c7e6-46de-a389-6b9d99cfb0db', 'enable_image_analysis', '"true"', 'integrations', 'Habilitar análise de imagens', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.549191-03');
INSERT INTO impaai.system_settings VALUES ('6fb4bbeb-c5f2-422b-9743-371ad316130b', 'enable_audio_transcription', '"true"', 'integrations', 'Habilitar transcrição de áudio', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.606485-03');
INSERT INTO impaai.system_settings VALUES ('02e239df-29c3-4c99-8d28-b3d95b5efc0b', 'webhook_timeout', '"30"', 'whatsapp', 'Timeout para webhooks em segundos', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.666885-03');
INSERT INTO impaai.system_settings VALUES ('54194db3-6e60-4a7a-a1e7-da462a59ebce', 'auto_reconnect_enabled', '"true"', 'whatsapp', 'Habilitar reconexão automática', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.723357-03');
INSERT INTO impaai.system_settings VALUES ('fd955e7f-6871-40d3-b265-d3a4cfc69640', 'default_theme', '"light"', 'theme', 'Tema padrão do sistema', true, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.780355-03');
INSERT INTO impaai.system_settings VALUES ('6eaa5ead-8003-416f-ab12-32c9c08cebe0', 'available_llm_providers', '"openai,anthropic,google,ollama,groq"', 'agents', 'Provedores de LLM disponíveis para criação de agentes', false, false, '2025-07-11 03:12:24.712425-03', '2025-07-15 22:15:28.837364-03');
INSERT INTO impaai.system_settings VALUES ('09140303-5e49-4304-9df0-0e8d0972d81a', 'max_connections_per_user', '"1"', 'whatsapp', 'Máximo de conexões WhatsApp por usuário', false, false, '2025-07-04 21:24:26.082368-03', '2025-07-15 22:15:28.895396-03');
INSERT INTO impaai.system_settings VALUES ('e7a7adbf-22f7-40ae-a465-1de87958a850', 'default_model', '"[object Object]"', 'agents', 'Modelo padrão', false, false, '2025-06-24 12:55:03.886934-03', '2025-07-15 22:15:28.954436-03');
INSERT INTO impaai.system_settings VALUES ('980a2314-f8e8-42da-832a-3c54016128bb', 'system_name', '"Impa AI"', 'general', 'Nome do sistema', true, false, '2025-07-04 21:23:08.650997-03', '2025-07-15 22:26:30.623421-03');
INSERT INTO impaai.system_settings VALUES (gen_random_uuid(), 'landing_page_enabled', 'true', 'interface', 'Controla se a landing page está ativa ou se deve mostrar login direto', false, false, NOW(), NOW());2:15:29.010996-03');


--
-- TOC entry 4116 (class 0 OID 18209)
-- Dependencies: 328
-- Data for Name: system_themes; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.system_themes VALUES ('f7a45b92-92fb-4cc6-b62d-5d7c033293f9', 'dark', 'Tema Escuro', 'Tema escuro para uso noturno', '{"text": "#F1F5F9", "accent": "#34D399", "border": "#334155", "primary": "#60A5FA", "surface": "#1E293B", "secondary": "#94A3B8", "background": "#0F172A"}', '{}', '{}', '🌙', false, true, '2025-07-04 21:24:26.082368-03', '2025-07-04 21:24:26.082368-03');
INSERT INTO impaai.system_themes VALUES ('71acd692-eeec-47da-946e-a966855f14e9', 'blue', 'Azul Profissional', 'Tema azul para ambiente corporativo', '{"text": "#1E293B", "accent": "#0EA5E9", "border": "#CBD5E1", "primary": "#2563EB", "surface": "#F1F5F9", "secondary": "#475569", "background": "#FFFFFF"}', '{}', '{}', '💼', false, true, '2025-07-04 21:24:26.082368-03', '2025-07-04 21:24:26.082368-03');
INSERT INTO impaai.system_themes VALUES ('00ba4e68-3341-4901-9d9a-aa54e4b6e6a7', 'default', 'Impa AI', 'Tema padrão do sistema Impa AI', '{"accent": "#8b5cf6", "primary": "#3b82f6", "secondary": "#10b981"}', '{"primary": "Inter, sans-serif"}', '{"radius": "0.5rem"}', '🤖', false, true, '2025-07-04 21:23:08.650997-03', '2025-07-04 21:23:08.650997-03');
INSERT INTO impaai.system_themes VALUES ('51e67fc8-c71c-4e91-95fd-9d579f49ee1d', 'default_blue', 'Impa AI2', 'Tema padrão azul da plataforma', '{"text": "#1e293b", "accent": "#8b5cf6", "primary": "#3b82f6", "secondary": "#10b981", "background": "#ffffff"}', '{}', '{}', '🤖', false, true, '2025-06-24 12:55:03.886934-03', '2025-06-24 12:55:03.886934-03');
INSERT INTO impaai.system_themes VALUES ('b23d9a31-dbd1-4f7e-81dd-203975983bba', 'light', 'Tema Claro', 'Tema claro padrão do sistema', '{"text": "#1E293B", "accent": "#10B981", "border": "#E2E8F0", "primary": "#3B82F6", "surface": "#F8FAFC", "secondary": "#64748B", "background": "#FFFFFF"}', '{}', '{}', '🤖', false, true, '2025-07-04 21:24:26.082368-03', '2025-07-04 21:24:26.082368-03');
INSERT INTO impaai.system_themes VALUES ('d0c92456-d605-47d8-a215-15806e4ea3ef', 'impa_ai', 'Impa Ai', 'Tema claro padrão do sistema', '{"text": "#1e293b", "accent": "#10B981", "primary": "#3B82F6", "secondary": "#64748B", "background": "#ffffff"}', '{}', '{}', '🤖', true, true, '2025-07-15 01:37:04.087-03', '2025-07-15 15:03:27.391-03');
INSERT INTO impaai.system_themes VALUES ('3c6363fb-8082-48b1-b7b6-ec5670508184', 'agentes_black_midia', 'Impa Ai', 'Tema claro padrão do sistema', '{"text": "#1e293b", "accent": "#10B981", "primary": "#3B82F6", "secondary": "#64748B", "background": "#ffffff"}', '{}', '{}', '🤖', false, true, '2025-07-15 01:38:57.108-03', '2025-07-15 12:43:14.074-03');


--
-- TOC entry 4112 (class 0 OID 18089)
-- Dependencies: 324
-- Data for Name: user_api_keys; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.user_api_keys VALUES ('3fc2d50a-f491-447c-92c8-376b69199f36', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'impaai_TZUiViiyr6mvloEwvvdEfG1STS1Dsm5h', 'DFGD', 'API Key para integração com sistemas externos', '["read"]', 100, true, '2025-07-16 18:05:43.673-03', NULL, '2025-06-24 14:10:51.220895-03', '2025-07-16 18:05:43.717707-03', 'user', false, '[]', 0);


--
-- TOC entry 4111 (class 0 OID 18061)
-- Dependencies: 323
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.user_profiles VALUES ('30b8c118-bc46-402a-af4e-7100c4279db2', 'Usuário de Teste', 'user@impa.ai', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'active', NULL, NULL, NULL, NULL, 'America/Sao_Paulo', 'pt-BR', 'impaai_a1823ddfbac54a14b3ba43269afcb777', true, '{"analytics": false, "beta_features": false, "notifications": true}', '{"mode": "light", "color": "blue", "customizations": {}}', 2, 1, 1000, NULL, 0, '2025-07-04 21:24:26.082368-03', '2025-07-14 14:44:06.486344-03');
INSERT INTO impaai.user_profiles VALUES ('b17ea646-fd96-46b3-ad6b-708451325a49', 'Administrador do Sistema', 'admin@impa.ai', '$2b$12$/P8k7iiIQFzSo5IEX46FMuS6Ld9nniA6UE8.caHdHqcnrvVimRiK.', 'admin', 'active', NULL, NULL, NULL, NULL, 'America/Sao_Paulo', 'pt-BR', 'impaai_604d6581e1c6452eaf5ca1091b26498c', true, '{}', '{"mode": "light", "color": "blue"}', 999, 999, 999999, '2025-07-16 09:21:51.701-03', 62, '2025-06-24 12:55:46.436018-03', '2025-07-16 09:21:52.082252-03');
INSERT INTO impaai.user_profiles VALUES ('336da799-412d-4774-bdf6-79dfb5312754', 'Impaaa', 'jorrandesonlorra7787n@gmail.com', '$2b$12$lGLppTahTlZhmn8ylS18LOeBJLQIMRaoXKR1fXyEYGIEOrFWJgSIO', 'user', 'active', NULL, NULL, NULL, NULL, 'America/Sao_Paulo', 'pt-BR', 'impaai_982c6ef37c9c4590b7300957e30407dd', false, '{}', '{"mode": "light", "color": "blue"}', 2, 1, 1000, '2025-07-15 15:25:10.421-03', 12, '2025-07-08 15:14:18.059-03', '2025-07-15 15:25:11.569081-03');


--
-- TOC entry 4113 (class 0 OID 18110)
-- Dependencies: 325
-- Data for Name: whatsapp_connections; Type: TABLE DATA; Schema: impaai; Owner: supabase_admin
--

INSERT INTO impaai.whatsapp_connections VALUES ('89860543-0b7e-4a1f-ab5f-fa77e99f6a01', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'TESTEAL', 'impaai_testeal_1866', '17cf85e9-fba4-4f99-bee3-6766c98b914c', 'A57F6969-79CD-4285-A783-798460BDFFC6', NULL, 'connected', NULL, NULL, NULL, '["message"]', '{}', true, 5, 30, 0, 0, NULL, NULL, 0.00, '2025-06-24 14:09:00.914458-03', '2025-07-05 15:21:49.769943-03', 'Gostaria de auxilio, algo mais?', 'Agradecemos seu contato, Até Mais!');
INSERT INTO impaai.whatsapp_connections VALUES ('5276807b-485b-4389-8107-220d0462be48', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'doutorJose', 'impaai_doutorjose_3984', 'f19d595a-9d7b-4672-a228-73de898297c5', '43C8D6DE-F900-4912-9CFE-564913103D6E', NULL, 'connecting', NULL, NULL, NULL, '["message"]', '{"msgCall": "", "readStatus": false, "rejectCall": false, "wavoipToken": "", "alwaysOnline": false, "groupsIgnore": false, "readMessages": false, "syncFullHistory": false}', true, 5, 30, 0, 0, NULL, NULL, 0.00, '2025-07-07 12:38:37.844426-03', '2025-07-16 09:19:58.642847-03', 'Oi, tudo bem? Atualizamos algumas informações por aqui e lembrei de você!', 'Perfeito! Qualquer novidade é só chamar. Já deixei seu contato encaminhado aqui.');
INSERT INTO impaai.whatsapp_connections VALUES ('c32f24ab-a92b-4d71-b432-461dc56ed127', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'ALBERTO', 'impaai_alberto_8671', 'b1022391-1744-46a3-8350-2c297edc524f', '0E5A81B0-ED75-408F-ACA9-8533B0317580', NULL, 'connecting', NULL, NULL, NULL, '["message"]', '{}', true, 5, 30, 0, 0, NULL, NULL, 0.00, '2025-07-14 12:08:28.635335-03', '2025-07-16 09:19:58.660052-03', 'Gostaria de auxilio, algo mais?', 'Agradecemos seu contato, Até Mais!');
INSERT INTO impaai.whatsapp_connections VALUES ('a8a6e1a4-223b-46af-81f8-8aa3a3f738fc', 'b17ea646-fd96-46b3-ad6b-708451325a49', 'DRTHIAGO', 'impaai_drthiago_9755', '5c6aca50-d459-42cc-ad35-eba0a9849add', '27FF069B-B6D9-47BE-8463-4658F0CA1C20', NULL, 'connected', NULL, NULL, NULL, '["message"]', '{"msgCall": "", "readStatus": true, "rejectCall": false, "wavoipToken": "", "alwaysOnline": true, "groupsIgnore": true, "readMessages": true, "syncFullHistory": false}', true, 5, 30, 0, 0, NULL, NULL, 0.00, '2025-06-24 16:13:48.60551-03', '2025-07-15 14:43:40.099781-03', 'Oi! Tudo bem? Aqui é a Keila, da Doutor Hérnia.
Vi que você nos procurou por causa da dor na coluna.
Vamos cuidar disso? Posso te ajudar a agendar sua consulta!', 'Perfeito! Qualquer novidade é só chamar. Já deixei seu contato encaminhado aqui.');


--
-- TOC entry 4199 (class 0 OID 0)
-- Dependencies: 343
-- Name: bookings_cal_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai.bookings_cal_id_seq', 1, false);


--
-- TOC entry 4200 (class 0 OID 0)
-- Dependencies: 336
-- Name: folowUp24hs_mensagem_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai."folowUp24hs_mensagem_id_seq"', 11, true);


--
-- TOC entry 4201 (class 0 OID 0)
-- Dependencies: 334
-- Name: lead_folow24hs_id_seq; Type: SEQUENCE SET; Schema: impaai; Owner: supabase_admin
--

SELECT pg_catalog.setval('impaai.lead_folow24hs_id_seq', 40, true);


--
-- TOC entry 3925 (class 2606 OID 18265)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 18250)
-- Name: agent_activity_logs agent_activity_logs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.agent_activity_logs
    ADD CONSTRAINT agent_activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3889 (class 2606 OID 18183)
-- Name: ai_agents ai_agents_evolution_bot_id_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_evolution_bot_id_key UNIQUE (evolution_bot_id);


--
-- TOC entry 3891 (class 2606 OID 18181)
-- Name: ai_agents ai_agents_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_pkey PRIMARY KEY (id);


--
-- TOC entry 3941 (class 2606 OID 30224)
-- Name: bookings_cal bookings_cal_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.bookings_cal
    ADD CONSTRAINT bookings_cal_pkey PRIMARY KEY (id);


--
-- TOC entry 3929 (class 2606 OID 18284)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 3939 (class 2606 OID 19466)
-- Name: folowUp24hs_mensagem folowup24hs_mensagem_impaai_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai."folowUp24hs_mensagem"
    ADD CONSTRAINT folowup24hs_mensagem_impaai_pkey PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 18237)
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 18239)
-- Name: integrations integrations_type_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.integrations
    ADD CONSTRAINT integrations_type_key UNIQUE (type);


--
-- TOC entry 3937 (class 2606 OID 19269)
-- Name: lead_folow24hs lead_folow24hs_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.lead_folow24hs
    ADD CONSTRAINT lead_folow24hs_pkey PRIMARY KEY (id);


--
-- TOC entry 3935 (class 2606 OID 18307)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3907 (class 2606 OID 18206)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3909 (class 2606 OID 18208)
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 3911 (class 2606 OID 18225)
-- Name: system_themes system_themes_name_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_themes
    ADD CONSTRAINT system_themes_name_key UNIQUE (name);


--
-- TOC entry 3913 (class 2606 OID 18223)
-- Name: system_themes system_themes_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.system_themes
    ADD CONSTRAINT system_themes_pkey PRIMARY KEY (id);


--
-- TOC entry 3878 (class 2606 OID 18104)
-- Name: user_api_keys user_api_keys_api_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_api_key_key UNIQUE (api_key);


--
-- TOC entry 3880 (class 2606 OID 18102)
-- Name: user_api_keys user_api_keys_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_pkey PRIMARY KEY (id);


--
-- TOC entry 3867 (class 2606 OID 18088)
-- Name: user_profiles user_profiles_api_key_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_api_key_key UNIQUE (api_key);


--
-- TOC entry 3869 (class 2606 OID 18086)
-- Name: user_profiles user_profiles_email_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_email_key UNIQUE (email);


--
-- TOC entry 3871 (class 2606 OID 18084)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3885 (class 2606 OID 18129)
-- Name: whatsapp_connections whatsapp_connections_pkey; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_pkey PRIMARY KEY (id);


--
-- TOC entry 3887 (class 2606 OID 18131)
-- Name: whatsapp_connections whatsapp_connections_user_id_instance_name_key; Type: CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_instance_name_key UNIQUE (user_id, instance_name);


--
-- TOC entry 3926 (class 1259 OID 18336)
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_activity_logs_created_at ON impaai.activity_logs USING btree (created_at);


--
-- TOC entry 3927 (class 1259 OID 18335)
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_activity_logs_user_id ON impaai.activity_logs USING btree (user_id);


--
-- TOC entry 3922 (class 1259 OID 18333)
-- Name: idx_agent_activity_logs_agent_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_agent_activity_logs_agent_id ON impaai.agent_activity_logs USING btree (agent_id);


--
-- TOC entry 3923 (class 1259 OID 18334)
-- Name: idx_agent_activity_logs_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_agent_activity_logs_created_at ON impaai.agent_activity_logs USING btree (created_at);


--
-- TOC entry 3892 (class 1259 OID 19846)
-- Name: idx_ai_agents_chatnode; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_chatnode ON impaai.ai_agents USING btree (chatnode_integration) WHERE (chatnode_integration = true);


--
-- TOC entry 3893 (class 1259 OID 18655)
-- Name: idx_ai_agents_chatnode_integration; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_chatnode_integration ON impaai.ai_agents USING btree (chatnode_integration);


--
-- TOC entry 3894 (class 1259 OID 18332)
-- Name: idx_ai_agents_default_per_connection; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE UNIQUE INDEX idx_ai_agents_default_per_connection ON impaai.ai_agents USING btree (whatsapp_connection_id) WHERE (is_default = true);


--
-- TOC entry 3895 (class 1259 OID 18331)
-- Name: idx_ai_agents_evolution_bot_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_evolution_bot_id ON impaai.ai_agents USING btree (evolution_bot_id);


--
-- TOC entry 3896 (class 1259 OID 19847)
-- Name: idx_ai_agents_orimon; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_orimon ON impaai.ai_agents USING btree (orimon_integration) WHERE (orimon_integration = true);


--
-- TOC entry 3897 (class 1259 OID 18656)
-- Name: idx_ai_agents_orimon_integration; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_orimon_integration ON impaai.ai_agents USING btree (orimon_integration);


--
-- TOC entry 3898 (class 1259 OID 18329)
-- Name: idx_ai_agents_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_status ON impaai.ai_agents USING btree (status);


--
-- TOC entry 3899 (class 1259 OID 18654)
-- Name: idx_ai_agents_trigger_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_trigger_type ON impaai.ai_agents USING btree (trigger_type);


--
-- TOC entry 3900 (class 1259 OID 18653)
-- Name: idx_ai_agents_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_type ON impaai.ai_agents USING btree (type);


--
-- TOC entry 3901 (class 1259 OID 18328)
-- Name: idx_ai_agents_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_user_id ON impaai.ai_agents USING btree (user_id);


--
-- TOC entry 3902 (class 1259 OID 19848)
-- Name: idx_ai_agents_voice_enabled; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_voice_enabled ON impaai.ai_agents USING btree (voice_response_enabled) WHERE (voice_response_enabled = true);


--
-- TOC entry 3903 (class 1259 OID 18330)
-- Name: idx_ai_agents_whatsapp_connection; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_ai_agents_whatsapp_connection ON impaai.ai_agents USING btree (whatsapp_connection_id);


--
-- TOC entry 3930 (class 1259 OID 18337)
-- Name: idx_conversations_agent_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_conversations_agent_id ON impaai.conversations USING btree (agent_id);


--
-- TOC entry 3931 (class 1259 OID 18338)
-- Name: idx_conversations_contact_phone; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_conversations_contact_phone ON impaai.conversations USING btree (contact_phone);


--
-- TOC entry 3914 (class 1259 OID 18344)
-- Name: idx_integrations_active; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_integrations_active ON impaai.integrations USING btree (is_active);


--
-- TOC entry 3915 (class 1259 OID 18343)
-- Name: idx_integrations_type; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_integrations_type ON impaai.integrations USING btree (type);


--
-- TOC entry 3932 (class 1259 OID 18339)
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_messages_conversation_id ON impaai.messages USING btree (conversation_id);


--
-- TOC entry 3933 (class 1259 OID 18340)
-- Name: idx_messages_created_at; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_messages_created_at ON impaai.messages USING btree (created_at);


--
-- TOC entry 3904 (class 1259 OID 18342)
-- Name: idx_system_settings_category; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_system_settings_category ON impaai.system_settings USING btree (category);


--
-- TOC entry 3905 (class 1259 OID 18341)
-- Name: idx_system_settings_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_system_settings_key ON impaai.system_settings USING btree (setting_key);


--
-- TOC entry 3872 (class 1259 OID 18551)
-- Name: idx_user_api_keys_access_scope; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_access_scope ON impaai.user_api_keys USING btree (access_scope);


--
-- TOC entry 3873 (class 1259 OID 18324)
-- Name: idx_user_api_keys_active; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_active ON impaai.user_api_keys USING btree (is_active) WHERE (is_active = true);


--
-- TOC entry 3874 (class 1259 OID 18552)
-- Name: idx_user_api_keys_admin; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_admin ON impaai.user_api_keys USING btree (is_admin_key) WHERE (is_admin_key = true);


--
-- TOC entry 3875 (class 1259 OID 18323)
-- Name: idx_user_api_keys_api_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_api_key ON impaai.user_api_keys USING btree (api_key);


--
-- TOC entry 3876 (class 1259 OID 18322)
-- Name: idx_user_api_keys_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_api_keys_user_id ON impaai.user_api_keys USING btree (user_id);


--
-- TOC entry 3862 (class 1259 OID 18321)
-- Name: idx_user_profiles_api_key; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_api_key ON impaai.user_profiles USING btree (api_key) WHERE (api_key IS NOT NULL);


--
-- TOC entry 3863 (class 1259 OID 18318)
-- Name: idx_user_profiles_email; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_email ON impaai.user_profiles USING btree (email);


--
-- TOC entry 3864 (class 1259 OID 18319)
-- Name: idx_user_profiles_role; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_role ON impaai.user_profiles USING btree (role);


--
-- TOC entry 3865 (class 1259 OID 18320)
-- Name: idx_user_profiles_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_user_profiles_status ON impaai.user_profiles USING btree (status);


--
-- TOC entry 3881 (class 1259 OID 18327)
-- Name: idx_whatsapp_connections_instance; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_instance ON impaai.whatsapp_connections USING btree (instance_name);


--
-- TOC entry 3882 (class 1259 OID 18326)
-- Name: idx_whatsapp_connections_status; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_status ON impaai.whatsapp_connections USING btree (status);


--
-- TOC entry 3883 (class 1259 OID 18325)
-- Name: idx_whatsapp_connections_user_id; Type: INDEX; Schema: impaai; Owner: supabase_admin
--

CREATE INDEX idx_whatsapp_connections_user_id ON impaai.whatsapp_connections USING btree (user_id);


--
-- TOC entry 3957 (class 2620 OID 18348)
-- Name: ai_agents update_ai_agents_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON impaai.ai_agents FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3959 (class 2620 OID 18350)
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON impaai.conversations FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3958 (class 2620 OID 18349)
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON impaai.system_settings FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3955 (class 2620 OID 18346)
-- Name: user_api_keys update_user_api_keys_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON impaai.user_api_keys FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3954 (class 2620 OID 18345)
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON impaai.user_profiles FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3956 (class 2620 OID 18347)
-- Name: whatsapp_connections update_whatsapp_connections_updated_at; Type: TRIGGER; Schema: impaai; Owner: supabase_admin
--

CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON impaai.whatsapp_connections FOR EACH ROW EXECUTE FUNCTION impaai.update_updated_at_column();


--
-- TOC entry 3947 (class 2606 OID 18266)
-- Name: activity_logs activity_logs_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.activity_logs
    ADD CONSTRAINT activity_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE SET NULL;


--
-- TOC entry 3946 (class 2606 OID 18251)
-- Name: agent_activity_logs agent_activity_logs_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.agent_activity_logs
    ADD CONSTRAINT agent_activity_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE CASCADE;


--
-- TOC entry 3944 (class 2606 OID 18184)
-- Name: ai_agents ai_agents_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3945 (class 2606 OID 18189)
-- Name: ai_agents ai_agents_whatsapp_connection_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.ai_agents
    ADD CONSTRAINT ai_agents_whatsapp_connection_id_fkey FOREIGN KEY (whatsapp_connection_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL;


--
-- TOC entry 3948 (class 2606 OID 18285)
-- Name: conversations conversations_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE CASCADE;


--
-- TOC entry 3949 (class 2606 OID 18290)
-- Name: conversations conversations_whatsapp_connection_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.conversations
    ADD CONSTRAINT conversations_whatsapp_connection_id_fkey FOREIGN KEY (whatsapp_connection_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE SET NULL;


--
-- TOC entry 3953 (class 2606 OID 19467)
-- Name: folowUp24hs_mensagem folowup24hs_mensagem_impaai_whatsapp_conenections_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai."folowUp24hs_mensagem"
    ADD CONSTRAINT folowup24hs_mensagem_impaai_whatsapp_conenections_id_fkey FOREIGN KEY (whatsapp_conenections_id) REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE;


--
-- TOC entry 3952 (class 2606 OID 19270)
-- Name: lead_folow24hs lead_folow24hs_whatsappconection_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.lead_folow24hs
    ADD CONSTRAINT lead_folow24hs_whatsappconection_fkey FOREIGN KEY ("whatsappConection") REFERENCES impaai.whatsapp_connections(id) ON DELETE CASCADE;


--
-- TOC entry 3950 (class 2606 OID 18313)
-- Name: messages messages_agent_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES impaai.ai_agents(id) ON DELETE SET NULL;


--
-- TOC entry 3951 (class 2606 OID 18308)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES impaai.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 3942 (class 2606 OID 18105)
-- Name: user_api_keys user_api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.user_api_keys
    ADD CONSTRAINT user_api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3943 (class 2606 OID 18132)
-- Name: whatsapp_connections whatsapp_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE ONLY impaai.whatsapp_connections
    ADD CONSTRAINT whatsapp_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES impaai.user_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 4106 (class 3256 OID 30266)
-- Name: bookings_cal Anon full access bookings_cal; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Anon full access bookings_cal" ON impaai.bookings_cal TO anon USING (true) WITH CHECK (true);


--
-- TOC entry 4109 (class 3256 OID 18369)
-- Name: integrations Public read access to integrations; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to integrations" ON impaai.integrations FOR SELECT USING (true);


--
-- TOC entry 4107 (class 3256 OID 18367)
-- Name: system_settings Public read access to system settings; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to system settings" ON impaai.system_settings FOR SELECT USING ((is_public = true));


--
-- TOC entry 4108 (class 3256 OID 18368)
-- Name: system_themes Public read access to system themes; Type: POLICY; Schema: impaai; Owner: supabase_admin
--

CREATE POLICY "Public read access to system themes" ON impaai.system_themes FOR SELECT USING (true);


--
-- TOC entry 4105 (class 0 OID 30216)
-- Dependencies: 344
-- Name: bookings_cal; Type: ROW SECURITY; Schema: impaai; Owner: supabase_admin
--

ALTER TABLE impaai.bookings_cal ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 71
-- Name: SCHEMA impaai; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA impaai TO anon;
GRANT USAGE ON SCHEMA impaai TO authenticated;
GRANT ALL ON SCHEMA impaai TO service_role;


--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 520
-- Name: FUNCTION change_user_password(p_user_id uuid, p_old_password text, p_new_password text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) TO service_role;
GRANT ALL ON FUNCTION impaai.change_user_password(p_user_id uuid, p_old_password text, p_new_password text) TO authenticated;


--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 522
-- Name: FUNCTION create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO anon;
GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO authenticated;
GRANT ALL ON FUNCTION impaai.create_user_api_key(p_user_id uuid, p_name text, p_api_key text, p_description text) TO service_role;


--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 518
-- Name: FUNCTION custom_login(p_email text, p_password text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.custom_login(p_email text, p_password text) TO service_role;
GRANT ALL ON FUNCTION impaai.custom_login(p_email text, p_password text) TO authenticated;


--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 519
-- Name: FUNCTION custom_register(p_email text, p_password text, p_full_name text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) TO service_role;
GRANT ALL ON FUNCTION impaai.custom_register(p_email text, p_password text, p_full_name text) TO authenticated;


--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 514
-- Name: FUNCTION generate_api_key(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.generate_api_key() TO authenticated;
GRANT ALL ON FUNCTION impaai.generate_api_key() TO anon;
GRANT ALL ON FUNCTION impaai.generate_api_key() TO service_role;


--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 496
-- Name: FUNCTION get_active_theme(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_active_theme() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_active_theme() TO anon;
GRANT ALL ON FUNCTION impaai.get_active_theme() TO service_role;


--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 493
-- Name: FUNCTION get_active_users(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_active_users() TO anon;
GRANT ALL ON FUNCTION impaai.get_active_users() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_active_users() TO service_role;


--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 491
-- Name: FUNCTION get_all_api_keys(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO anon;
GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_all_api_keys() TO service_role;


--
-- TOC entry 4143 (class 0 OID 0)
-- Dependencies: 489
-- Name: FUNCTION get_all_api_keys(p_admin_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_all_api_keys(p_admin_user_id uuid) TO authenticated;


--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 488
-- Name: FUNCTION get_all_users(p_admin_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_all_users(p_admin_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_all_users(p_admin_user_id uuid) TO authenticated;


--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 524
-- Name: FUNCTION get_public_settings(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_public_settings() TO authenticated;
GRANT ALL ON FUNCTION impaai.get_public_settings() TO anon;
GRANT ALL ON FUNCTION impaai.get_public_settings() TO service_role;


--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 523
-- Name: FUNCTION get_user_api_key_by_key(p_api_key text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_api_key_by_key(p_api_key text) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_api_key_by_key(p_api_key text) TO authenticated;


--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 521
-- Name: FUNCTION get_user_api_keys(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_api_keys(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_api_keys(p_user_id uuid) TO authenticated;


--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 516
-- Name: FUNCTION get_user_profile(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.get_user_profile(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.get_user_profile(p_user_id uuid) TO authenticated;


--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 515
-- Name: FUNCTION increment_api_key_usage(p_api_key text); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.increment_api_key_usage(p_api_key text) TO service_role;
GRANT ALL ON FUNCTION impaai.increment_api_key_usage(p_api_key text) TO authenticated;


--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 498
-- Name: FUNCTION is_public_registration_allowed(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO authenticated;
GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO anon;
GRANT ALL ON FUNCTION impaai.is_public_registration_allowed() TO service_role;


--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 487
-- Name: FUNCTION is_user_admin(p_user_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.is_user_admin(p_user_id uuid) TO service_role;
GRANT ALL ON FUNCTION impaai.is_user_admin(p_user_id uuid) TO authenticated;


--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 486
-- Name: FUNCTION update_connection_sync(connection_id uuid); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO authenticated;
GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO anon;
GRANT ALL ON FUNCTION impaai.update_connection_sync(connection_id uuid) TO service_role;


--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 405
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION impaai.update_updated_at_column() TO service_role;


--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 517
-- Name: FUNCTION update_user_profile(p_user_id uuid, p_updates json); Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) TO service_role;
GRANT ALL ON FUNCTION impaai.update_user_profile(p_user_id uuid, p_updates json) TO authenticated;


--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 331
-- Name: TABLE activity_logs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.activity_logs TO service_role;


--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 330
-- Name: TABLE agent_activity_logs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.agent_activity_logs TO service_role;


--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 326
-- Name: TABLE ai_agents; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.ai_agents TO service_role;


--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 344
-- Name: TABLE bookings_cal; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.bookings_cal TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai.bookings_cal TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.bookings_cal TO service_role;


--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 343
-- Name: SEQUENCE bookings_cal_id_seq; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai.bookings_cal_id_seq TO anon;
GRANT SELECT,USAGE ON SEQUENCE impaai.bookings_cal_id_seq TO authenticated;


--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 332
-- Name: TABLE conversations; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.conversations TO service_role;


--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 337
-- Name: TABLE "folowUp24hs_mensagem"; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai."folowUp24hs_mensagem" TO authenticated;


--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 336
-- Name: SEQUENCE "folowUp24hs_mensagem_id_seq"; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai."folowUp24hs_mensagem_id_seq" TO service_role;
GRANT SELECT,USAGE ON SEQUENCE impaai."folowUp24hs_mensagem_id_seq" TO authenticated;


--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 329
-- Name: TABLE integrations; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.integrations TO service_role;


--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 335
-- Name: TABLE lead_folow24hs; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.lead_folow24hs TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.lead_folow24hs TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE impaai.lead_folow24hs TO authenticated;


--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 334
-- Name: SEQUENCE lead_folow24hs_id_seq; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE impaai.lead_folow24hs_id_seq TO service_role;
GRANT SELECT,USAGE ON SEQUENCE impaai.lead_folow24hs_id_seq TO authenticated;


--
-- TOC entry 4188 (class 0 OID 0)
-- Dependencies: 333
-- Name: TABLE messages; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.messages TO service_role;


--
-- TOC entry 4190 (class 0 OID 0)
-- Dependencies: 327
-- Name: TABLE system_settings; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_settings TO service_role;


--
-- TOC entry 4192 (class 0 OID 0)
-- Dependencies: 328
-- Name: TABLE system_themes; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.system_themes TO service_role;


--
-- TOC entry 4194 (class 0 OID 0)
-- Dependencies: 324
-- Name: TABLE user_api_keys; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_api_keys TO service_role;


--
-- TOC entry 4196 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE user_profiles; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.user_profiles TO service_role;


--
-- TOC entry 4198 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE whatsapp_connections; Type: ACL; Schema: impaai; Owner: supabase_admin
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE impaai.whatsapp_connections TO service_role;


--
-- TOC entry 2545 (class 826 OID 19615)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,USAGE ON SEQUENCES TO authenticated;


--
-- TOC entry 2541 (class 826 OID 19696)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT ALL ON FUNCTIONS TO authenticated;


--
-- TOC entry 2544 (class 826 OID 19614)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: impaai; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA impaai GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO service_role;


-- Completed on 2025-07-16 18:09:54

--
-- PostgreSQL database dump complete
--

