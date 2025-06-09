import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = request.headers.get("apikey")
    const botId = params.id

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    if (!botId) {
      return NextResponse.json({ error: "ID do bot é obrigatório" }, { status: 400 })
    }

    // Buscar usuário pela API key
    const { data: user, error: userError } = await db.users().select("id").eq("api_key", apiKey).single()

    if (userError || !user) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    // Buscar o agente específico
    const { data: agent, error: agentError } = await db
      .agents()
      .select(`
        *,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
          id,
          connection_name,
          phone_number,
          status,
          instance_name
        )
      `)
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Bot não encontrado" }, { status: 404 })
    }

    // Buscar logs recentes do agente
    const { data: recentLogs, error: logsError } = await db
      .activityLogs()
      .select("id, activity_type, created_at, activity_data")
      .eq("agent_id", botId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) {
      console.warn("Erro ao buscar logs:", logsError)
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
      },
      recent_activity: recentLogs || [],
    })
  } catch (error) {
    console.error("Erro na API getbot:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
