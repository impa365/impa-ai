import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { db } from "@/lib/supabase" // Assumindo que db é o cliente Supabase ou uma factory

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateApiKey(request)

    if (!validation.isValid || !validation.user) {
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user } = validation
    const agentId = params.id

    // Obter o cliente Supabase (ajuste conforme a implementação de @/lib/supabase)
    // Se 'db' já for o cliente, pode usar diretamente. Se for uma função, chame-a.
    // Exemplo: const supabase = db; ou const supabase = await db();
    // Para este exemplo, vou assumir que 'db' pode ser usado para 'from' diretamente
    // ou que existe uma função getClient() ou similar.
    // A forma mais comum é que 'db' já seja o cliente Supabase.

    const supabaseClient = db // Ajuste se 'db' for uma função como db() ou db.getClient()

    // Buscar agente específico da tabela 'ai_agents' e fazer join com 'user_profiles'
    const { data: agent, error: agentError } = await supabaseClient
      .from("ai_agents")
      .select(`
        *,
        user_profiles (
          id,
          name,
          email
        )
      `)
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.error("Erro ao buscar agente ou agente não encontrado:", agentError?.message)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Buscar modelo padrão do sistema (esta parte parece OK, mas verificando a tabela)
    // Assumindo que 'agent_system_settings' é a tabela correta para 'default_model'
    const { data: defaultModelData, error: modelError } = await supabaseClient
      .from("agent_system_settings") // Corrigido para agent_system_settings
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    if (modelError && modelError.code !== "PGRST116") {
      // PGRST116 = single row not found, o que é ok se não houver default
      console.error("Erro ao buscar modelo padrão:", modelError?.message)
    }
    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    const isAdminAccess = user.role === "admin"
    if (!canAccessAgent(user.role, isAdminAccess, agent.user_id, user.id)) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      const { data: connectionData, error: connError } = await supabaseClient
        .from("whatsapp_connections") // Corrigido para whatsapp_connections
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
              // Verificar se user_profiles existe
              id: agent.user_profiles.id,
              name: agent.user_profiles.name,
              email: agent.user_profiles.email,
            }
          : null,
      },
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
