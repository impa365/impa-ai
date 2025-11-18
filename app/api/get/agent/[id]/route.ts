import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar API key
    const authResult = await validateApiKey(request);

    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json(
        {
          error: authResult.error || "Unauthorized",
          message: "API key validation failed",
        },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const agentId = params.id;

    // Configurar Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Server configuration error: Supabase URL or Anon Key is missing."
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    });

    // Buscar modelo padrão
    const { data: defaultModelData, error: defaultModelError } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single();

    let systemDefaultModel = null;
    if (defaultModelError) {
      console.error("❌ Erro ao buscar default_model:", defaultModelError);
    } else if (defaultModelData && defaultModelData.setting_value) {
      systemDefaultModel = defaultModelData.setting_value.toString().trim();
      console.log("✅ Default model encontrado:", systemDefaultModel);
    }

    // Buscar agente específico
    let query = supabase
      .from("ai_agents")
      .select(
        `
        *,
        user_profiles (
          id,
          full_name,
          email
        )
      `
      )
      .eq("id", agentId)
      .eq("status", "active");

    // Se não for admin, verificar se o agente pertence ao usuário
    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data: agent, error: agentError } = await query.single();

    if (agentError || !agent) {
      console.error(
        `Agente não encontrado com ID: ${agentId}. Erro: ${agentError?.message}`
      );
      return NextResponse.json(
        { error: "Agente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar disponibilidade do agente
    const availabilityMode = agent.availability_mode || 'always';
    
    if (availabilityMode === 'disabled') {
      console.warn(`🚫 Agente ${agentId} está desativado (availability_mode=disabled)`);
      return NextResponse.json(
        { 
          error: "Agente não disponível",
          message: "Este agente está temporariamente desativado",
          availability: {
            mode: 'disabled',
            is_available: false
          }
        },
        { status: 403 }
      );
    }
    
    if (availabilityMode === 'schedule') {
      // Usar função PostgreSQL para verificar disponibilidade
      const { data: availabilityCheck, error: availError } = await supabase
        .rpc('is_agent_available', { 
          p_agent_id: agentId,
          p_check_time: new Date().toISOString()
        });
      
      if (availError) {
        console.error('❌ Erro ao verificar disponibilidade:', availError);
        // Em caso de erro, permitir acesso por segurança
      } else if (availabilityCheck === false) {
        // Buscar próximo horário disponível
        const { data: nextSchedule } = await supabase
          .from('agent_availability_schedules')
          .select('day_of_week, start_time, timezone')
          .eq('agent_id', agentId)
          .eq('is_active', true)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(1)
          .single();
        
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const nextAvailability = nextSchedule 
          ? `${dayNames[nextSchedule.day_of_week]} às ${nextSchedule.start_time} (${nextSchedule.timezone})`
          : 'Consulte o administrador';
        
        console.warn(`🕐 Agente ${agentId} fora do horário de atendimento`);
        return NextResponse.json(
          { 
            error: "Agente fora do horário de atendimento",
            message: "Este agente está disponível apenas em horários específicos",
            availability: {
              mode: 'schedule',
              is_available: false,
              next_available: nextAvailability
            }
          },
          { status: 403 }
        );
      }
    }

    // Buscar conexão WhatsApp se existir
    let whatsappConnection = null;
    if (agent.whatsapp_connection_id) {
      const { data: connectionData, error: connError } = await supabase
        .from("whatsapp_connections")
        .select("id, instance_name, status, phone_number, connection_name")
        .eq("id", agent.whatsapp_connection_id)
        .single();

      if (connError && connError.code !== "PGRST116") {
        console.error("Erro ao buscar conexão WhatsApp:", connError?.message);
      }
      whatsappConnection = connectionData;
    }

    // Resolver llm_api_key se for referência salva
    let resolvedLlmApiKey = agent.llm_api_key;
    if (agent.llm_api_key && agent.llm_api_key.startsWith("__SAVED_KEY__")) {
      const keyId = agent.llm_api_key.replace("__SAVED_KEY__", "");
      console.log("🔑 Resolvendo chave salva:", keyId);
      
      const { data: savedKey, error: keyError } = await supabase
        .from("llm_api_keys")
        .select("api_key")
        .eq("id", keyId)
        .eq("is_active", true)
        .single();
      
      if (savedKey && !keyError) {
        resolvedLlmApiKey = savedKey.api_key;
        console.log("✅ Chave salva resolvida:", `${resolvedLlmApiKey?.slice(0, 7)}...`);
      } else {
        console.warn("⚠️ Chave salva não encontrada:", keyId);
      }
    }

    // Se não tiver API key (null/vazio) e tiver provedor, buscar chave padrão do sistema no banco
    // Verificar se é null, undefined ou string vazia
    const hasNoApiKey = !resolvedLlmApiKey || 
                        resolvedLlmApiKey === null || 
                        resolvedLlmApiKey === "" || 
                        resolvedLlmApiKey.trim() === "";
    
    if (hasNoApiKey && agent.model_config) {
      const provider = agent.model_config.toLowerCase();
      
      // Buscar chave padrão do sistema no banco para o provedor
      const { data: globalKey, error: globalKeyError } = await supabase
        .from("llm_api_keys")
        .select("api_key")
        .eq("provider", provider)
        .eq("is_default", true)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (globalKey && !globalKeyError && globalKey.api_key) {
        resolvedLlmApiKey = globalKey.api_key;
        console.log(`✅ Usando API key padrão do sistema para o provedor ${provider}`);
      } else {
        console.warn(`⚠️ API key padrão do sistema não encontrada para o provedor ${provider}`);
      }
    }

    const calendarProvider = agent.calendar_provider || "calcom";
    const calendarVersion =
      calendarProvider === "calcom"
        ? agent.calendar_api_version || "v1"
        : agent.calendar_api_version;
    const calendarUrl =
      calendarProvider === "calcom"
        ? agent.calendar_api_url ||
          (calendarVersion === "v2" ? "https://api.cal.com/v2" : "https://api.cal.com/v1")
        : agent.calendar_api_url;

    const response = {
      success: true,
      default_model: systemDefaultModel,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar_url: agent.avatar_url,
        identity_description: agent.identity_description,
        training_prompt: agent.training_prompt,
        voice_tone: agent.voice_tone,
        main_function: agent.main_function,
        type: agent.type || "whatsapp",
        status: agent.status,
        model: agent.model || systemDefaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
        model_config: agent.model_config,
        llm_api_key: resolvedLlmApiKey, // ✅ API Key RESOLVIDA (completa se salva, ou manual)
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        calendar_provider: calendarProvider,
        calendar_api_version: calendarVersion,
        calendar_api_url: calendarUrl,
        calendar_api_key: agent.calendar_api_key,
        calendar_meeting_id: agent.calendar_meeting_id,
        chatnode_integration: agent.chatnode_integration,
        chatnode_api_key: agent.chatnode_api_key,
        chatnode_bot_id: agent.chatnode_bot_id,
        orimon_integration: agent.orimon_integration,
        orimon_api_key: agent.orimon_api_key,
        orimon_bot_id: agent.orimon_bot_id,
        voice_provider: agent.voice_provider,
        voice_id: agent.voice_id,
        voice_api_key: agent.voice_api_key,
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
        trigger_operator: agent.trigger_operator,
        trigger_value: agent.trigger_value,
        keyword_finish: agent.keyword_finish,
        debounce_time: agent.debounce_time,
        listening_from_me: agent.listening_from_me,
        stop_bot_from_me: agent.stop_bot_from_me,
        keep_open: agent.keep_open,
        split_messages: agent.split_messages,
        time_per_char: agent.time_per_char,
        delay_message: agent.delay_message,
        unknown_message: agent.unknown_message,
        expire_time: agent.expire_time,
        ignore_jids: agent.ignore_jids,
        working_hours: agent.working_hours,
        auto_responses: agent.auto_responses,
        fallback_responses: agent.fallback_responses,
        performance_score: agent.performance_score || 0,
        total_conversations: agent.total_conversations || 0,
        total_messages: agent.total_messages || 0,
        last_training_at: agent.last_training_at,
        evolution_bot_id: agent.evolution_bot_id,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        whatsapp_connection: whatsappConnection,
        owner: agent.user_profiles
          ? {
              id: agent.user_profiles.id,
              name: agent.user_profiles.full_name,
              email: agent.user_profiles.email,
            }
          : null,
      },
      access_info: {
        is_admin_access: user.role === "admin",
        access_scope: user.role === "admin" ? "admin" : "user",
        requester: {
          id: user.id,
          name: user.full_name,
          role: user.role,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("API Route Error in /api/get/agent/[id]:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
