import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = request.headers.get("apikey")
    const botId = params.id

    console.log("🔍 API getbot chamada:", { botId, hasApiKey: !!apiKey })

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    if (!botId) {
      return NextResponse.json({ error: "ID do bot é obrigatório" }, { status: 400 })
    }

    // Buscar informações da API key
    const { data: apiKeyData, error: apiKeyError } = await db
      .apiKeys()
      .select(`
        id,
        user_id,
        is_admin_key,
        access_scope,
        user_profiles!user_api_keys_user_id_fkey(
          id,
          role,
          full_name,
          email
        )
      `)
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (apiKeyError || !apiKeyData) {
      console.log("❌ API key inválida:", apiKeyError?.message)
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    console.log("✅ API key válida:", {
      userId: apiKeyData.user_id,
      isAdmin: apiKeyData.is_admin_key,
      scope: apiKeyData.access_scope,
      userRole: apiKeyData.user_profiles?.role,
    })

    // Buscar o agente com base no escopo de acesso
    let agentQuery = db
      .agents()
      .select(`
        *,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
          id,
          connection_name,
          phone_number,
          status,
          instance_name
        ),
        user_profiles!ai_agents_user_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq("id", botId)

    // Se não for API key de admin, filtrar apenas bots do próprio usuário
    if (!apiKeyData.is_admin_key || apiKeyData.access_scope !== "admin") {
      agentQuery = agentQuery.eq("user_id", apiKeyData.user_id)
      console.log("🔒 Acesso restrito aos próprios bots do usuário")
    } else {
      console.log("🔓 Acesso de administrador - pode acessar qualquer bot")
    }

    const { data: agent, error: agentError } = await agentQuery.single()

    if (agentError || !agent) {
      console.log("❌ Bot não encontrado:", agentError?.message)
      return NextResponse.json({ error: "Bot não encontrado ou sem permissão de acesso" }, { status: 404 })
    }

    console.log("✅ Bot encontrado:", {
      agentId: agent.id,
      agentName: agent.name,
      ownerId: agent.user_id,
      ownerName: agent.user_profiles?.full_name,
    })

    // Buscar logs recentes do agente
    const { data: recentLogs, error: logsError } = await db
      .activityLogs()
      .select("id, activity_type, created_at, activity_data")
      .eq("agent_id", botId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) {
      console.warn("⚠️ Erro ao buscar logs:", logsError)
    }

    // Atualizar último uso da API key
    await db.apiKeys().update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        main_function: agent.main_function,
        voice_tone: agent.voice_tone,
        identity_description: agent.identity_description,
        training_prompt: agent.training_prompt,
        model_config: agent.model_config,
        temperature: agent.temperature,
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,
        is_default: agent.is_default,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        whatsapp_connection: agent.whatsapp_connections,
        owner: apiKeyData.is_admin_key
          ? {
              id: agent.user_profiles?.id,
              name: agent.user_profiles?.full_name,
              email: agent.user_profiles?.email,
            }
          : undefined,
      },
      recent_activity: recentLogs || [],
      access_info: {
        is_admin_access: apiKeyData.is_admin_key,
        access_scope: apiKeyData.access_scope,
        requester: {
          id: apiKeyData.user_profiles?.id,
          name: apiKeyData.user_profiles?.full_name,
          role: apiKeyData.user_profiles?.role,
        },
      },
    })
  } catch (error) {
    console.error("💥 Erro na API getbot:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
