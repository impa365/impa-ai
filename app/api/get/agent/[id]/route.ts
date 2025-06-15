import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // REMOVER: const apiKey = request.headers.get("apikey")
    // REMOVER: if (!apiKey) { ... }

    // ALTERAR PARA:
    const validation = await validateApiKey(request)

    if (!validation.isValid || !validation.user) {
      return NextResponse.json({ error: validation.error || "Falha na autenticação da API key" }, { status: 401 })
    }

    const { user } = validation // Extrair o usuário validado
    // REMOVER: const { user, apiKeyData } = validation (apiKeyData não é mais retornado assim)

    const agentId = params.id

    // Buscar modelo padrão do sistema
    const { data: defaultModelData } = await (await db.users())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    // Buscar agente específico
    const { data: agent, error } = await (await db.users()).select("*").eq("id", agentId).single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // ALTERAR LÓGICA DE PERMISSÃO:
    // A função canAccessAgent espera isAdminKey. Vamos inferir isso.
    // Se a API key pertencer a um usuário admin, ou se a própria chave tiver um status de admin.
    // A função validateApiKey em lib/api-auth.ts não retorna is_admin_key diretamente.
    // Vamos assumir por agora que se o user.role é 'admin', a chave tem privilégios de admin.
    // Para uma lógica mais granular, a tabela user_api_keys precisaria de uma coluna is_admin_key
    // e validateApiKey precisaria retorná-la.
    // Por simplicidade, usaremos user.role.
    const isAdminAccess = user.role === "admin"

    if (!canAccessAgent(user.role, isAdminAccess, agent.user_id, user.id)) {
      return NextResponse.json({ error: "Sem permissão para acessar este agente" }, { status: 403 })
    }

    // Buscar conexão WhatsApp se existir
    let whatsappConnection = null
    if (agent.whatsapp_connection_id) {
      const { data: connectionData } = await (await db.users())
        .select("instance_name, status, qr_code")
        .eq("id", agent.whatsapp_connection_id)
        .single()

      whatsappConnection = connectionData
    }

    // Formatar resposta detalhada
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

      // Funcionalidades
      features: {
        transcribe_audio: {
          enabled: agent.transcribe_audio,
          description: agent.transcribe_audio ? "Transcrição de áudio ativada" : "Transcrição de áudio desativada",
        },
        understand_images: {
          enabled: agent.understand_images,
          description: agent.understand_images ? "Análise de imagens ativada" : "Análise de imagens desativada",
        },
        voice_response_enabled: {
          enabled: agent.voice_response_enabled,
          description: agent.voice_response_enabled ? "Respostas por voz ativadas" : "Respostas por voz desativadas",
          voice_provider: agent.voice_provider,
          voice_id: agent.voice_id,
        },
        calendar_integration: {
          enabled: agent.calendar_integration,
          description: agent.calendar_integration
            ? "Integração com calendário ativada"
            : "Integração com calendário desativada",
        },
        chatnode_integration: {
          enabled: agent.chatnode_integration,
          description: agent.chatnode_integration
            ? "Integração com ChatNode ativada"
            : "Integração com ChatNode desativada",
        },
        orimon_integration: {
          enabled: agent.orimon_integration,
          description: agent.orimon_integration ? "Integração com Orimon ativada" : "Integração com Orimon desativada",
        },
      },

      // Configurações de comportamento
      behavior: {
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
      },

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
