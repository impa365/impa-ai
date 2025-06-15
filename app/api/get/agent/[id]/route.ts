import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar API key usando o objeto request completo
    const validation = await validateApiKey(request) // Passa o objeto request

    if (!validation.isValid || !validation.user) {
      // Adiciona verificação para user
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user } = validation // Extrai o usuário validado
    const agentId = params.id

    // Buscar modelo padrão do sistema
    const { data: defaultModelData } = await (await db.users())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    // Buscar agente específico com informações do proprietário
    const { data: agent, error } = await (await db.users())
      .select(`
      *,
      user_profiles!ai_agents_user_id_fkey (
        id,
        name,
        email
      )
    `)
      .eq("id", agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    const isAdminAccess = user.role === "admin" // Inferir acesso de admin pelo papel do usuário
    if (!canAccessAgent(user.role, isAdminAccess, agent.user_id, user.id)) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    // Buscar conexão WhatsApp se existir
    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      const { data: connectionData } = await (await db.users())
        .select("id, instance_name, status, phone_number, connection_name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      whatsappConnection = connectionData
    }

    // Estruturar resposta organizada
    const response = {
      success: true,
      default_model: defaultModel,
      agent: {
        // Informações básicas
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

        // Configurações do modelo IA
        model: agent.model || defaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
        model_config: agent.model_config,

        // Funcionalidades (true/false)
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,

        // Configurações de voz
        voice_provider: agent.voice_provider,
        voice_id: agent.voice_id,

        // Configurações de comportamento
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,

        // Horários e respostas
        working_hours: agent.working_hours,
        auto_responses: agent.auto_responses,
        fallback_responses: agent.fallback_responses,

        // Estatísticas
        performance_score: agent.performance_score || 0,
        total_conversations: agent.total_conversations || 0,
        total_messages: agent.total_messages || 0,
        last_training_at: agent.last_training_at,

        // Integrações
        evolution_bot_id: agent.evolution_bot_id,
        chatnode_bot_id: agent.chatnode_bot_id,
        orimon_bot_id: agent.orimon_bot_id,
        calendar_meeting_id: agent.calendar_meeting_id,

        // Datas
        created_at: agent.created_at,
        updated_at: agent.updated_at,

        // Conexão WhatsApp
        whatsapp_connection: whatsappConnection,

        // Proprietário
        owner: {
          id: agent.user_profiles.id,
          name: agent.user_profiles.name,
          email: agent.user_profiles.email,
        },
      },

      // Informações de acesso
      access_info: {
        is_admin_access: isAdminAccess,
        access_scope: user!.role === "admin" ? "admin" : "user",
        requester: {
          id: user!.id,
          name: user!.name,
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
