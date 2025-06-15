import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth" // canAccessAgent pode precisar de ajuste ou remoção se a lógica mudar
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateApiKey(request)

    if (!validation.isValid || !validation.user) {
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user: requestingUser } = validation // Usuário que está fazendo a requisição
    const agentId = params.id

    // Buscar agente específico
    const { data: agent, error: agentError } = await (await db.agents())
      .select(`
        *,
        user_profiles (id, full_name, email, role),
        whatsapp_connections (id, instance_name, status, phone_number, name)
      `)
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.error("Erro ao buscar agente ou agente não encontrado:", agentError)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Informações do proprietário do agente
    const ownerInfo = agent.user_profiles
      ? {
          id: agent.user_profiles.id,
          name: agent.user_profiles.full_name,
          email: agent.user_profiles.email,
        }
      : null

    // Informações da conexão WhatsApp
    const whatsappConnectionInfo = agent.whatsapp_connections
      ? {
          id: agent.whatsapp_connections.id,
          status: agent.whatsapp_connections.status,
          phone_number: agent.whatsapp_connections.phone_number,
          instance_name: agent.whatsapp_connections.instance_name,
          connection_name: agent.whatsapp_connections.name, // Assumindo que 'name' é o nome da conexão
        }
      : null

    // Buscar modelo padrão do sistema (se necessário, ou pode ser removido se o agente sempre tiver um modelo)
    const { data: defaultModelData } = await (await db.systemSettings())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()
    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    // Lógica de permissão de acesso (simplificada)
    // Um admin pode ver tudo. Um usuário pode ver seus próprios agentes.
    const isAdminAccess = requestingUser.role === "admin"
    const canViewAgent = isAdminAccess || agent.user_id === requestingUser.id

    if (!canViewAgent) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    const detailedAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar_url: agent.avatar_url,
      identity_description: agent.identity_description,
      training_prompt: agent.training_prompt,
      voice_tone: agent.voice_tone,
      main_function: agent.main_function,
      type: agent.type || "chat",

      model_settings: {
        model: agent.model || defaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
      },

      features: {
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        voice_provider: agent.voice_provider,
        voice_id: agent.voice_id,
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration, // Supondo que este campo exista
        orimon_integration: agent.orimon_integration, // Supondo que este campo exista
      },

      behavior: {
        is_default: agent.is_default,
        listening_from_me: agent.listen_own_messages, // Mapeado de listen_own_messages
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
        activation_keyword: agent.trigger_type === "keyword" ? agent.trigger_keyword : null, // Mapeado de trigger_keyword
      },

      working_hours: agent.working_hours, // Assumindo que é um JSON ou objeto
      auto_responses: agent.auto_responses, // Assumindo que é um JSON ou objeto
      fallback_responses: agent.fallback_responses, // Assumindo que é um JSON ou objeto

      whatsapp_connection: whatsappConnectionInfo,
      evolution_bot_id: agent.evolution_bot_id,

      statistics: {
        status: agent.status,
        performance_score: agent.performance_score || 0,
        total_conversations: agent.total_conversations || 0,
        total_messages: agent.total_messages || 0,
      },

      owner: ownerInfo,

      metadata: {
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        last_training_at: agent.last_training_at,
      },

      access_info: {
        is_admin_access: isAdminAccess, // Se o requisitante é admin
        access_scope: requestingUser.role, // Papel do requisitante
        requester: {
          id: requestingUser.id,
          name: requestingUser.full_name, // Assumindo que full_name está no objeto user de validateApiKey
          role: requestingUser.role,
        },
      },
      // recent_activity: [], // Para adicionar depois, se necessário (requer query adicional)
    }

    return NextResponse.json({
      success: true,
      agent: detailedAgent,
    })
  } catch (error) {
    console.error("Erro na API get agent:", error)
    // Verifica se o erro é uma instância de Error para acessar a propriedade message
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor"
    return NextResponse.json({ error: "Erro interno do servidor", details: errorMessage }, { status: 500 })
  }
}
