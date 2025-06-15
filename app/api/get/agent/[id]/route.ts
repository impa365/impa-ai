// @ts-nocheck
// TODO: Arrumar os types desse arquivo
import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey, canAccessAgent } from "@/lib/api-auth" // Garanta que canAccessAgent e hasPermission estão exportados
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const agentId = params.id
  console.log(`GET /api/get/agent/[id] - Rota iniciada para o ID: ${agentId}`)

  try {
    const authResult = await validateApiKey(request)
    console.log(`GET /api/get/agent/[id] - Resultado da validação da API key:`, {
      isValid: authResult.isValid,
      error: authResult.error,
      status: authResult.status,
      userId: authResult.user?.id,
    })

    if (!authResult.isValid || !authResult.user) {
      console.error(
        `GET /api/get/agent/[id] - Erro na validação da API key: ${authResult.error || "Usuário não autenticado"}`,
      )
      return NextResponse.json({ error: authResult.error || "Não autorizado" }, { status: authResult.status || 401 })
    }

    const { user } = authResult

    // Opcional: Verificar permissão específica para ler agentes, se aplicável
    // if (!hasPermission(user.role, user.is_admin_key, 'read:agents')) {
    //   console.warn(`GET /api/get/agent/[id] - Usuário ${user.id} não tem permissão 'read:agents'.`);
    //   return NextResponse.json({ error: "Permissão negada para ler agentes" }, { status: 403 });
    // }

    console.log(`GET /api/get/agent/[id] - Buscando agente com ID: ${agentId} para usuário ${user.id}`)

    const supabaseAgentsClient = await db.aiAgents() // Usando a função correta de lib/supabase.ts
    const { data: agent, error: dbError } = await supabaseAgentsClient
      .select(
        `
        id,
        name,
        description,
        model,
        training_prompt, 
        temperature,
        max_tokens,
        status,
        created_at,
        updated_at,
        user_id,
        type,
        main_function,
        total_conversations,
        total_messages,
        performance_score,
        avatar_url,
        identity_description,
        voice_tone,
        top_p,
        frequency_penalty,
        presence_penalty,
        model_config,
        transcribe_audio,
        understand_images,
        voice_response_enabled,
        voice_provider,
        voice_id,
        calendar_integration,
        chatnode_integration,
        orimon_integration,
        is_default,
        listen_own_messages,
        stop_bot_by_me,
        keep_conversation_open,
        split_long_messages,
        character_wait_time,
        trigger_type,
        working_hours,
        auto_responses,
        fallback_responses,
        evolution_bot_id,
        last_training_at,
        whatsapp_connection_id,
        whatsapp_connections ( instance_name, status, qr_code )
      `,
      )
      .eq("id", agentId)
      .maybeSingle() // Use maybeSingle para não dar erro se não encontrar, apenas retornar null

    if (dbError) {
      console.error(`GET /api/get/agent/[id] - Erro do Supabase ao buscar agente:`, dbError)
      return NextResponse.json(
        { error: "Erro ao buscar agente no banco de dados", details: dbError.message, hint: dbError.hint },
        { status: 500 },
      )
    }

    if (!agent) {
      console.warn(`GET /api/get/agent/[id] - Agente com ID ${agentId} não encontrado.`)
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário tem permissão para acessar este agente específico
    // Assumindo que apiKeyData está dentro de authResult se necessário, ou user.role/user.id é suficiente
    const userCanAccess = canAccessAgent(
      user.role,
      authResult.apiKeyData?.is_admin_key, // Verifique se apiKeyData está disponível e tem is_admin_key
      agent.user_id,
      user.id,
    )

    if (!userCanAccess) {
      console.warn(
        `GET /api/get/agent/[id] - Usuário ${user.id} não tem permissão para acessar o agente ${agentId} (proprietário: ${agent.user_id}).`,
      )
      return NextResponse.json({ error: "Acesso negado a este agente" }, { status: 403 })
    }

    console.log(`GET /api/get/agent/[id] - Agente ${agentId} encontrado e sendo retornado.`)
    // Formatar a resposta para corresponder ao que o /api/get-all/agent retorna para um único agente
    const formattedAgent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar_url: agent.avatar_url,
      identity_description: agent.identity_description,
      training_prompt: agent.training_prompt,
      voice_tone: agent.voice_tone,
      main_function: agent.main_function,
      model_settings: {
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        top_p: agent.top_p,
        frequency_penalty: agent.frequency_penalty,
        presence_penalty: agent.presence_penalty,
        config_json: agent.model_config, // Renomeado de model_config para config_json para clareza
      },
      features: {
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response: {
          enabled: agent.voice_response_enabled,
          provider: agent.voice_provider,
          voice_id: agent.voice_id,
        },
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,
      },
      behavior: {
        is_default: agent.is_default,
        listen_own_messages: agent.listen_own_messages,
        stop_bot_by_me: agent.stop_bot_by_me,
        keep_conversation_open: agent.keep_conversation_open,
        split_long_messages: agent.split_long_messages,
        character_wait_time: agent.character_wait_time,
        trigger_type: agent.trigger_type,
      },
      operational_hours: agent.working_hours, // Renomeado de working_hours para operational_hours
      automated_responses: {
        // Renomeado de auto_responses para automated_responses
        general: agent.auto_responses,
        fallback: agent.fallback_responses,
      },
      whatsapp_integration: {
        evolution_bot_id: agent.evolution_bot_id,
        connection_details: agent.whatsapp_connections // Este já vem como um objeto do Supabase se o join funcionar
          ? {
              instance_name: agent.whatsapp_connections.instance_name,
              status: agent.whatsapp_connections.status,
              qr_code: agent.whatsapp_connections.qr_code, // Cuidado ao expor QR code aqui
            }
          : null,
      },
      status: agent.status,
      stats: {
        performance_score: agent.performance_score,
        total_conversations: agent.total_conversations,
        total_messages: agent.total_messages,
      },
      meta: {
        user_id: agent.user_id,
        last_training_at: agent.last_training_at,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        type: agent.type,
      },
    }

    return NextResponse.json({ success: true, agent: formattedAgent })
  } catch (error: any) {
    console.error(`GET /api/get/agent/[id] - Erro CATCH GERAL na rota para ID ${agentId}:`, error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message || String(error) },
      { status: 500 },
    )
  }
}
