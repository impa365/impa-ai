-- CreateEnum
CREATE TYPE "availability_mode_enum" AS ENUM ('always', 'schedule', 'disabled');

-- CreateEnum
CREATE TYPE "llm_provider_enum" AS ENUM ('openai', 'anthropic', 'google', 'ollama', 'groq');

-- CreateEnum
CREATE TYPE "operador_gatilho_enum" AS ENUM ('Contém', 'Igual', 'Começa Com', 'Termina Com', 'Regex');

-- CreateEnum
CREATE TYPE "tipo_gatilho_enum" AS ENUM ('Palavra-chave', 'Todos', 'Avançado', 'Nenhum');

-- CreateEnum
CREATE TYPE "tipo_midia" AS ENUM ('text', 'image', 'video', 'audio', 'document');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "avatar_url" TEXT,
    "phone" VARCHAR(20),
    "company" VARCHAR(255),
    "bio" TEXT,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    "language" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    "api_key" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "theme_settings" JSONB NOT NULL DEFAULT '{"mode": "light", "color": "blue"}',
    "agents_limit" INTEGER NOT NULL DEFAULT 3,
    "connections_limit" INTEGER NOT NULL DEFAULT 5,
    "monthly_messages_limit" INTEGER NOT NULL DEFAULT 1000,
    "last_login_at" TIMESTAMPTZ,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "can_access_agents" BOOLEAN NOT NULL DEFAULT true,
    "can_access_connections" BOOLEAN NOT NULL DEFAULT true,
    "hide_agents_menu" BOOLEAN NOT NULL DEFAULT false,
    "hide_connections_menu" BOOLEAN NOT NULL DEFAULT false,
    "can_view_api_credentials" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "whatsapp_connection_id" UUID,
    "evolution_bot_id" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "avatar_url" TEXT,
    "identity_description" TEXT,
    "training_prompt" TEXT NOT NULL,
    "voice_tone" VARCHAR(50) NOT NULL DEFAULT 'humanizado',
    "main_function" VARCHAR(50) NOT NULL DEFAULT 'atendimento',
    "model" VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    "temperature" DECIMAL(3,2) DEFAULT 0.7,
    "max_tokens" INTEGER DEFAULT 1000,
    "top_p" DECIMAL(3,2) DEFAULT 1.0,
    "frequency_penalty" DECIMAL(3,2) DEFAULT 0.0,
    "presence_penalty" DECIMAL(3,2) DEFAULT 0.0,
    "model_config" JSONB NOT NULL DEFAULT '{}',
    "transcribe_audio" BOOLEAN NOT NULL DEFAULT false,
    "understand_images" BOOLEAN NOT NULL DEFAULT false,
    "voice_response_enabled" BOOLEAN NOT NULL DEFAULT false,
    "voice_provider" VARCHAR(20),
    "voice_api_key" TEXT,
    "voice_id" VARCHAR(255),
    "calendar_integration" BOOLEAN NOT NULL DEFAULT false,
    "calendar_api_key" TEXT,
    "calendar_meeting_id" VARCHAR(255),
    "chatnode_integration" BOOLEAN NOT NULL DEFAULT false,
    "chatnode_api_key" TEXT,
    "chatnode_bot_id" TEXT,
    "orimon_integration" BOOLEAN NOT NULL DEFAULT false,
    "orimon_api_key" TEXT,
    "orimon_bot_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "listen_own_messages" BOOLEAN NOT NULL DEFAULT false,
    "stop_bot_by_me" BOOLEAN NOT NULL DEFAULT true,
    "keep_conversation_open" BOOLEAN NOT NULL DEFAULT true,
    "split_long_messages" BOOLEAN NOT NULL DEFAULT true,
    "character_wait_time" INTEGER DEFAULT 100,
    "trigger_type" VARCHAR(50) DEFAULT 'all',
    "working_hours" JSONB NOT NULL DEFAULT '{"enabled": false, "schedule": {}, "timezone": "America/Sao_Paulo"}',
    "auto_responses" JSONB NOT NULL DEFAULT '{}',
    "fallback_responses" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'inactive',
    "last_training_at" TIMESTAMPTZ,
    "performance_score" DECIMAL(3,2) DEFAULT 0.00,
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    "prompt_template" TEXT,
    "trigger_operator" VARCHAR(20) DEFAULT 'equals',
    "trigger_value" VARCHAR(255),
    "keyword_finish" VARCHAR(100) DEFAULT '#sair',
    "debounce_time" INTEGER DEFAULT 10,
    "listening_from_me" BOOLEAN NOT NULL DEFAULT false,
    "stop_bot_from_me" BOOLEAN NOT NULL DEFAULT true,
    "keep_open" BOOLEAN NOT NULL DEFAULT false,
    "split_messages" BOOLEAN NOT NULL DEFAULT true,
    "time_per_char" INTEGER DEFAULT 100,
    "delay_message" INTEGER DEFAULT 1000,
    "unknown_message" TEXT DEFAULT 'Desculpe, não entendi. Digite a palavra-chave para começar.',
    "expire_time" INTEGER DEFAULT 0,
    "ignore_jids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bot_id" UUID,
    "llm_api_key" TEXT,
    "calendar_provider" TEXT DEFAULT 'calcom',
    "calendar_api_version" TEXT DEFAULT 'v1',
    "calendar_api_url" TEXT DEFAULT 'https://api.cal.com/v1',
    "availability_mode" "availability_mode_enum" NOT NULL DEFAULT 'always',

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "connection_name" VARCHAR(255) NOT NULL,
    "instance_name" VARCHAR(255) NOT NULL,
    "instance_id" VARCHAR(255),
    "instance_token" TEXT,
    "phone_number" VARCHAR(20),
    "status" VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    "qr_code" TEXT,
    "qr_expires_at" TIMESTAMPTZ,
    "webhook_url" TEXT,
    "webhook_events" JSONB NOT NULL DEFAULT '["message"]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "auto_reconnect" BOOLEAN NOT NULL DEFAULT true,
    "max_reconnect_attempts" INTEGER NOT NULL DEFAULT 5,
    "reconnect_interval" INTEGER NOT NULL DEFAULT 30,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "messages_received" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ,
    "last_seen_at" TIMESTAMPTZ,
    "uptime_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adciona_folow" TEXT DEFAULT 'Gostaria de auxilio, algo mais?',
    "remover_folow" TEXT DEFAULT 'Agradecemos seu contato, Até Mais!',
    "api_type" VARCHAR(50) NOT NULL DEFAULT 'evolution',

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR(255),
    "agent_id" UUID,
    "action" VARCHAR(255) NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id" VARCHAR(255),
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "activity_type" VARCHAR(100) NOT NULL,
    "activity_data" JSONB NOT NULL DEFAULT '{}',
    "user_message" TEXT,
    "agent_response" TEXT,
    "response_time_ms" INTEGER,
    "tokens_used" INTEGER,
    "cost_estimate" DECIMAL(10,6),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_availability_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_availability_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "user_id" UUID,
    "agent_id" UUID,
    "job_data" JSONB NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "processed_items" INTEGER NOT NULL DEFAULT 0,
    "successful_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings_cal" (
    "id" BIGINT NOT NULL,
    "Titulo da reuniao" TEXT,
    "Empresa" TEXT,
    "email_da_empresa" TEXT,
    "status" TEXT,
    "inicio_reuniao" TIMESTAMPTZ,
    "fim_da_reuniao" TIMESTAMPTZ,
    "duração" TEXT,
    "id_evento" BIGINT,
    "slug_evento" TEXT,
    "meetingUrl" TEXT,
    "localizacao" TEXT,
    "Nome do Participante" TEXT,
    "email_do_participante" TEXT,
    "whatsapp" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "lembrete_enviado" BOOLEAN NOT NULL DEFAULT false,
    "lembrete_24h_enviado" BOOLEAN NOT NULL DEFAULT false,
    "lembrete_3h_enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bookings_cal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_sessions" (
    "sessionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "remoteJid" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_status" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bot_id" UUID,
    "connection_id" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "bot_sessions_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "bots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "url_api" TEXT NOT NULL,
    "apikey" TEXT,
    "gatilho" "tipo_gatilho_enum" NOT NULL DEFAULT 'Palavra-chave',
    "operador_gatilho" "operador_gatilho_enum" NOT NULL DEFAULT 'Contém',
    "value_gatilho" TEXT,
    "debounce" DECIMAL(65,30) DEFAULT 5,
    "splitMessage" DECIMAL(65,30) DEFAULT 2,
    "ignoreJids" TEXT DEFAULT '@g.us,',
    "webhook_id" TEXT,
    "user_id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "padrao" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "whatsapp_connection_id" UUID,
    "contact_phone" VARCHAR(20) NOT NULL,
    "contact_name" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "last_message_at" TIMESTAMPTZ,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folowUp24hs_mensagem" (
    "id" BIGINT NOT NULL,
    "whatsapp_conenections_id" UUID NOT NULL,
    "tentativa_dia" DECIMAL(65,30),
    "tipo_mensagem" "tipo_midia",
    "mensagem" TEXT,
    "link" TEXT,

    CONSTRAINT "folowUp24hs_mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_folow24hs" (
    "id" BIGINT NOT NULL,
    "whatsappConection" UUID NOT NULL,
    "remoteJid" TEXT,
    "dia" DECIMAL(65,30),
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "lead_folow24hs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "key_name" VARCHAR(255) NOT NULL,
    "provider" "llm_provider_enum" NOT NULL,
    "api_key" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "agent_id" UUID,
    "direction" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(50) NOT NULL DEFAULT 'text',
    "media_url" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "n8n_workflows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflow_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "workflow_data" JSONB NOT NULL,
    "categoria" JSONB,
    "imagem_fluxo" TEXT,
    "criado_em" TIMESTAMPTZ,
    "ultima_atualizacao" TIMESTAMPTZ,
    "synced_to_n8n" BOOLEAN NOT NULL DEFAULT false,
    "n8n_workflow_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,

    CONSTRAINT "n8n_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_cron_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "duration_ms" INTEGER,
    "success" BOOLEAN,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "reminders_due" INTEGER NOT NULL DEFAULT 0,
    "reminders_sent" INTEGER NOT NULL DEFAULT 0,
    "reminders_failed" INTEGER NOT NULL DEFAULT 0,
    "triggers_processed" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_cron_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_trigger_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trigger_id" UUID NOT NULL,
    "booking_uid" TEXT NOT NULL,
    "scheduled_for" TIMESTAMPTZ NOT NULL,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "webhook_status" INTEGER,
    "webhook_response" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_trigger_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_triggers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "timing_type" TEXT NOT NULL DEFAULT 'before_event_start',
    "offset_amount" INTEGER NOT NULL,
    "offset_unit" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL DEFAULT 'agent',
    "scope_reference" TEXT,
    "action_type" TEXT NOT NULL DEFAULT 'webhook',
    "webhook_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "reminder_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_whatsapp_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "connection_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "password_hash" TEXT,
    "salt" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '{"stats": false, "qr_code": true, "settings": false}',
    "expires_at" TIMESTAMPTZ,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_accessed_at" TIMESTAMPTZ,
    "last_accessed_ip" INET,
    "access_logs" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_whatsapp_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "setting_key" VARCHAR(255) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "category" VARCHAR(100) DEFAULT 'general',
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "requires_restart" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_themes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "colors" JSONB NOT NULL,
    "fonts" JSONB NOT NULL DEFAULT '{}',
    "borders" JSONB NOT NULL DEFAULT '{}',
    "logo_icon" VARCHAR(10) DEFAULT '🤖',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_keys" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '["read"]',
    "rate_limit" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "access_scope" VARCHAR(50) NOT NULL DEFAULT 'user',
    "is_admin_key" BOOLEAN NOT NULL DEFAULT false,
    "allowed_ips" JSONB NOT NULL DEFAULT '[]',
    "usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quest_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "completed_missions" JSONB NOT NULL DEFAULT '[]',
    "unlocked_badges" JSONB NOT NULL DEFAULT '[]',
    "active_mission_id" TEXT,
    "mission_progress" JSONB NOT NULL DEFAULT '{}',
    "stats" JSONB NOT NULL DEFAULT '{"perfectMissions": 0, "fastestCompletionTime": null, "totalMissionsCompleted": 0}',
    "preferences" JSONB NOT NULL DEFAULT '{"soundEnabled": true, "ariaPersonality": "friendly", "autoStartMissions": false}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_api_key_key" ON "user_profiles"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agents_evolution_bot_id_key" ON "ai_agents"("evolution_bot_id");

-- CreateIndex
CREATE INDEX "idx_ai_agents_user_id" ON "ai_agents"("user_id");

-- CreateIndex
CREATE INDEX "idx_ai_agents_whatsapp_connection" ON "ai_agents"("whatsapp_connection_id");

-- CreateIndex
CREATE INDEX "idx_ai_agents_status" ON "ai_agents"("status");

-- CreateIndex
CREATE INDEX "idx_ai_agents_type" ON "ai_agents"("type");

-- CreateIndex
CREATE INDEX "idx_ai_agents_trigger_type" ON "ai_agents"("trigger_type");

-- CreateIndex
CREATE INDEX "idx_ai_agents_evolution_bot_id" ON "ai_agents"("evolution_bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_user_id_instance_name_key" ON "whatsapp_connections"("user_id", "instance_name");

-- CreateIndex
CREATE INDEX "idx_activity_logs_user_id" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_agent_activity_logs_agent_id" ON "agent_activity_logs"("agent_id");

-- CreateIndex
CREATE INDEX "idx_agent_activity_logs_created_at" ON "agent_activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_availability_agent_id" ON "agent_availability_schedules"("agent_id");

-- CreateIndex
CREATE INDEX "idx_availability_agent_day" ON "agent_availability_schedules"("agent_id", "day_of_week", "is_active");

-- CreateIndex
CREATE INDEX "idx_background_jobs_type" ON "background_jobs"("type");

-- CreateIndex
CREATE INDEX "idx_background_jobs_status" ON "background_jobs"("status");

-- CreateIndex
CREATE INDEX "idx_background_jobs_user_id" ON "background_jobs"("user_id");

-- CreateIndex
CREATE INDEX "idx_background_jobs_agent_id" ON "background_jobs"("agent_id");

-- CreateIndex
CREATE INDEX "idx_background_jobs_created_at" ON "background_jobs"("created_at");

-- CreateIndex
CREATE INDEX "idx_bot_sessions_remotejid" ON "bot_sessions"("remoteJid");

-- CreateIndex
CREATE INDEX "idx_bot_sessions_status" ON "bot_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_bot_sessions_bot_id" ON "bot_sessions"("bot_id");

-- CreateIndex
CREATE INDEX "idx_bot_sessions_connection_id" ON "bot_sessions"("connection_id");

-- CreateIndex
CREATE INDEX "idx_bots_user_id" ON "bots"("user_id");

-- CreateIndex
CREATE INDEX "idx_bots_connection_id" ON "bots"("connection_id");

-- CreateIndex
CREATE INDEX "idx_bots_webhook_id" ON "bots"("webhook_id");

-- CreateIndex
CREATE INDEX "idx_conversations_agent_id" ON "conversations"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_type_key" ON "integrations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "unique_key_name_per_user" ON "llm_api_keys"("user_id", "key_name");

-- CreateIndex
CREATE UNIQUE INDEX "n8n_workflows_workflow_id_key" ON "n8n_workflows"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_token" ON "shared_whatsapp_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "system_themes_name_key" ON "system_themes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_keys_api_key_key" ON "user_api_keys"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_progress" ON "user_quest_progress"("user_id");

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_whatsapp_connection_id_fkey" FOREIGN KEY ("whatsapp_connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_connections" ADD CONSTRAINT "whatsapp_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_activity_logs" ADD CONSTRAINT "agent_activity_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_availability_schedules" ADD CONSTRAINT "agent_availability_schedules_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_sessions" ADD CONSTRAINT "bot_sessions_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_sessions" ADD CONSTRAINT "bot_sessions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_whatsapp_connection_id_fkey" FOREIGN KEY ("whatsapp_connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folowUp24hs_mensagem" ADD CONSTRAINT "folowUp24hs_mensagem_whatsapp_conenections_id_fkey" FOREIGN KEY ("whatsapp_conenections_id") REFERENCES "whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_folow24hs" ADD CONSTRAINT "lead_folow24hs_whatsappConection_fkey" FOREIGN KEY ("whatsappConection") REFERENCES "whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_api_keys" ADD CONSTRAINT "llm_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_trigger_logs" ADD CONSTRAINT "reminder_trigger_logs_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "reminder_triggers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_triggers" ADD CONSTRAINT "reminder_triggers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_whatsapp_links" ADD CONSTRAINT "shared_whatsapp_links_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_whatsapp_links" ADD CONSTRAINT "shared_whatsapp_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
