import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar API key (correção: passar request em vez de apiKey string)
    const validation = await validateApiKey(request)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    const { user, apiKeyData } = validation
    const agentId = params.id

    // Buscar modelo padrão do sistema
    const { data: defaultModelData } = await (await db.systemSettings())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    // Buscar agente específico (manter como estava: db.users())
    const { data: agent, error } = await (await db.agents()).select("*").eq("id", agentId).single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Verificar permissões de acesso (assumir que apiKeyData.is_admin_key existe ou ajustar)
    const isAdminKey = user?.role === "admin" || false // Simplificação temporária
    if (!canAccessAgent(user!.role, isAdminKey, agent.user_id, user!.id)) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    // Buscar conexão WhatsApp se existir
    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      const { data: connectionData } = await (await db.whatsappConnections())
        .select("instance_name, status, phone_number, name")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      whatsappConnection = connectionData
    }

    // Formatar resposta detalhada (mantendo a estrutura original mas melhorada)
    const detailedAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar_url: agent.avatar_url,
      identity_description: agent.identity_description,
      training_prompt: agent.training_prompt,
      voice_tone: agent.voice_tone,
      main_function: agent.main_function,

      // Configurações do modelo
      model: agent.model || defaultModel,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      top_p: agent.top_p,
      frequency_penalty: agent.frequency_penalty,
      presence_penalty: agent.presence_penalty,

      // Funcionalidades (retornar booleanos diretos como pediu)
      transcribe_audio: agent.transcribe_audio,
      understand_images: agent.understand_images,
      voice_response_enabled: agent.voice_response_enabled,
      voice_provider: agent.voice_provider,
      voice_id: agent.voice_id,
      calendar_integration: agent.calendar_integration,
      chatnode_integration: agent.chatnode_integration,
      orimon_integration: agent.orimon_integration,

      // Configurações de comportamento
      is_default: agent.is_default,
      listening_from_me: agent.listen_own_messages,
      activation_keyword: agent.trigger_keyword,
      stop_bot_by_me: agent.stop_bot_by_me,
      keep_conversation_open: agent.keep_conversation_open,
      split_long_messages: agent.split_long_messages,
      character_wait_time: agent.character_wait_time,
      trigger_type: agent.trigger_type,

      // Horário de funcionamento
      working_hours: agent.working_hours,

      // Respostas automáticas
      auto_responses: agent.auto_responses,
      fallback_responses: agent.fallback_responses,

      // WhatsApp
      whatsapp_connection: whatsappConnection,
      evolution_bot_id: agent.evolution_bot_id,

      // Status e estatísticas
      status: agent.status,
      performance_score: agent.performance_score || 0,
      total_conversations: agent.total_conversations || 0,
      total_messages: agent.total_messages || 0,
      last_training_at: agent.last_training_at,

      // Metadados
      created_at: agent.created_at,
      updated_at: agent.updated_at,
      type: agent.type || "chat",
    }

    return NextResponse.json({
      success: true,
      default_model: defaultModel,
      agent: detailedAgent,
    })
  } catch (error) {
    console.error("Erro na API get agent:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
