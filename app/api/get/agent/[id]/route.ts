import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { db } from "@/lib/supabase" // db é o nosso objeto de helpers

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateApiKey(request)

    if (!validation.isValid || !validation.user) {
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user } = validation
    const agentId = params.id

    // Buscar agente específico da tabela 'ai_agents' e fazer join com 'user_profiles'
    // Usando o helper db.agents() que aponta para a tabela correta com o schema correto.
    const { data: agent, error: agentError } = await (await db.agents())
      .select(`
        *,
        user_profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.error(`Agente não encontrado com ID: ${agentId}. Erro: ${agentError?.message}`)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Buscar modelo padrão do sistema. O código original usa db.users() para isso.
    // Isso implica que a tabela user_profiles (ou a que db.users() aponta)
    // tem as colunas setting_key e setting_value.
    const { data: defaultModelData, error: modelError } = await (await db.users())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .eq("id", user.id) // Assumindo que é uma configuração por usuário, ou remover .eq("id", user.id) se for global em user_profiles
      .single()

    // Se for uma configuração global do sistema, o ideal seria usar db.systemSettings()
    // const { data: defaultModelData, error: modelError } = await (await db.systemSettings())
    //   .select("setting_value")
    //   .eq("setting_key", "default_model")
    //   .single();

    if (modelError && modelError.code !== "PGRST116") {
      // PGRST116: Single row not found
      console.error("Erro ao buscar modelo padrão:", modelError?.message)
    }
    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    const isAdminAccess = user.role === "admin"
    if (!canAccessAgent(user.role, isAdminAccess, agent.user_id, user.id)) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      const { data: connectionData, error: connError } = await (await db.whatsappConnections())
        .select("id, instance_name, status, phone_number, connection_name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      if (connError && connError.code !== "PGRST116") {
        console.error("Erro ao buscar conexão WhatsApp:", connError?.message)
      }
      whatsappConnection = connectionData
    }

    const response = {
      success: true,
      default_model: defaultModel,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        avatar_url: agent.avatar_url,
        identity_description: agent.identity_description,
        training_prompt: agent.training_prompt,
        voice_tone: agent.voice_tone,
        main_function: agent.main_function,
        type: agent.type || "chat",
        status: agent.status,
        model: agent.model || defaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
        model_config: agent.model_config,
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,
        voice_provider: agent.voice_provider,
        voice_id: agent.voice_id,
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
        working_hours: agent.working_hours,
        auto_responses: agent.auto_responses,
        fallback_responses: agent.fallback_responses,
        performance_score: agent.performance_score || 0,
        total_conversations: agent.total_conversations || 0,
        total_messages: agent.total_messages || 0,
        last_training_at: agent.last_training_at,
        evolution_bot_id: agent.evolution_bot_id,
        chatnode_bot_id: agent.chatnode_bot_id,
        orimon_bot_id: agent.orimon_bot_id,
        calendar_meeting_id: agent.calendar_meeting_id,
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
        is_admin_access: isAdminAccess,
        access_scope: user!.role === "admin" ? "admin" : "user",
        requester: {
          id: user!.id,
          name: user!.name, // Assumindo que 'name' existe em user, senão user.full_name
          role: user!.role,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Erro na API get agent:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
