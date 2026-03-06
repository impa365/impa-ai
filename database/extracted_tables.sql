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

CREATE TABLE impaai.agent_availability_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    timezone text DEFAULT 'America/Sao_Paulo'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agent_availability_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);

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
    bot_id uuid,
    llm_api_key text,
    calendar_provider text DEFAULT 'calcom'::text,
    calendar_api_version text DEFAULT 'v1'::text,
    calendar_api_url text DEFAULT 'https://api.cal.com/v1'::text,
    availability_mode impaai.availability_mode_enum DEFAULT 'always'::impaai.availability_mode_enum,
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

CREATE TABLE impaai.background_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    user_id uuid,
    agent_id uuid,
    job_data jsonb NOT NULL,
    progress integer DEFAULT 0,
    total_items integer DEFAULT 0,
    processed_items integer DEFAULT 0,
    successful_items integer DEFAULT 0,
    failed_items integer DEFAULT 0,
    results jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT background_jobs_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('running'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('cancelled'::character varying)::text])))
);

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

CREATE TABLE impaai.bot_sessions (
    "sessionId" uuid DEFAULT gen_random_uuid() NOT NULL,
    "remoteJid" text NOT NULL,
    status boolean DEFAULT true,
    ultimo_status timestamp with time zone DEFAULT now(),
    criado_em timestamp with time zone DEFAULT now(),
    bot_id uuid,
    connection_id uuid NOT NULL,
    deleted_at timestamp with time zone
);

CREATE TABLE impaai.bots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    url_api text NOT NULL,
    apikey text,
    gatilho impaai.tipo_gatilho_enum DEFAULT 'Palavra-chave'::impaai.tipo_gatilho_enum,
    operador_gatilho impaai.operador_gatilho_enum DEFAULT 'Contém'::impaai.operador_gatilho_enum,
    value_gatilho text,
    debounce numeric DEFAULT 5,
    "splitMessage" numeric DEFAULT 2,
    "ignoreJids" text DEFAULT '@g.us,'::text,
    webhook_id text,
    user_id uuid NOT NULL,
    connection_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    padrao boolean DEFAULT false NOT NULL
);

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

CREATE TABLE impaai.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE impaai.lead_folow24hs (
    id bigint NOT NULL,
    "whatsappConection" uuid NOT NULL,
    "remoteJid" text,
    dia numeric,
    updated_at timestamp with time zone
);

CREATE TABLE impaai.llm_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key_name character varying(255) NOT NULL,
    provider impaai.llm_provider_enum NOT NULL,
    api_key text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT key_name_not_empty CHECK ((length(TRIM(BOTH FROM key_name)) > 0))
);

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

CREATE TABLE impaai.n8n_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    workflow_data jsonb NOT NULL,
    categoria jsonb,
    imagem_fluxo text,
    criado_em timestamp with time zone,
    ultima_atualizacao timestamp with time zone,
    synced_to_n8n boolean DEFAULT false,
    n8n_workflow_id character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    descricao text
);

CREATE TABLE impaai.reminder_cron_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    duration_ms integer,
    success boolean,
    dry_run boolean DEFAULT false NOT NULL,
    reminders_due integer DEFAULT 0 NOT NULL,
    reminders_sent integer DEFAULT 0 NOT NULL,
    reminders_failed integer DEFAULT 0 NOT NULL,
    triggers_processed integer DEFAULT 0 NOT NULL,
    message text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE impaai.reminder_trigger_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trigger_id uuid NOT NULL,
    booking_uid text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    executed_at timestamp with time zone DEFAULT now() NOT NULL,
    success boolean DEFAULT false NOT NULL,
    webhook_status integer,
    webhook_response jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE impaai.reminder_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agent_id uuid NOT NULL,
    timing_type text DEFAULT 'before_event_start'::text NOT NULL,
    offset_amount integer NOT NULL,
    offset_unit text NOT NULL,
    scope_type text DEFAULT 'agent'::text NOT NULL,
    scope_reference text,
    action_type text DEFAULT 'webhook'::text NOT NULL,
    webhook_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    action_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT reminder_triggers_action_type_check CHECK ((action_type = ANY (ARRAY['webhook'::text, 'whatsapp_message'::text]))),
    CONSTRAINT reminder_triggers_offset_amount_check CHECK ((offset_amount >= 0)),
    CONSTRAINT reminder_triggers_offset_unit_check CHECK ((offset_unit = ANY (ARRAY['minutes'::text, 'hours'::text, 'days'::text]))),
    CONSTRAINT reminder_triggers_scope_type_check CHECK ((scope_type = ANY (ARRAY['agent'::text, 'calendar'::text, 'event_type'::text]))),
    CONSTRAINT reminder_triggers_webhook_url_check CHECK (((action_type <> 'webhook'::text) OR (webhook_url IS NOT NULL)))
);

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
    can_access_agents boolean DEFAULT true,
    can_access_connections boolean DEFAULT true,
    hide_agents_menu boolean DEFAULT false,
    hide_connections_menu boolean DEFAULT false,
    can_view_api_credentials boolean DEFAULT false,
    CONSTRAINT user_profiles_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('user'::character varying)::text, ('moderator'::character varying)::text]))),
    CONSTRAINT user_profiles_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('suspended'::character varying)::text])))
);

CREATE TABLE impaai.user_quest_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_xp integer DEFAULT 0,
    current_level integer DEFAULT 1,
    completed_missions jsonb DEFAULT '[]'::jsonb,
    unlocked_badges jsonb DEFAULT '[]'::jsonb,
    active_mission_id text,
    mission_progress jsonb DEFAULT '{}'::jsonb,
    stats jsonb DEFAULT '{"perfectMissions": 0, "fastestCompletionTime": null, "totalMissionsCompleted": 0}'::jsonb,
    preferences jsonb DEFAULT '{"soundEnabled": true, "ariaPersonality": "friendly", "autoStartMissions": false}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

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
    api_type character varying(50) DEFAULT 'evolution'::character varying NOT NULL,
    CONSTRAINT whatsapp_connections_api_type_check CHECK (((api_type)::text = ANY (ARRAY[('evolution'::character varying)::text, ('uazapi'::character varying)::text]))),
    CONSTRAINT whatsapp_connections_status_check CHECK (((status)::text = ANY (ARRAY[('connected'::character varying)::text, ('disconnected'::character varying)::text, ('connecting'::character varying)::text, ('error'::character varying)::text, ('banned'::character varying)::text])))
);
