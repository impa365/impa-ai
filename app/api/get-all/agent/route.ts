import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-auth"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("apikey")

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    // Validar API key
    const validation = await validateApiKey(apiKey)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    const { user, apiKeyData } = validation

    // Buscar modelo padrão do sistema
    const { data: defaultModelData } = await (await db.users())
      .select("setting_value")
      .eq("setting_key", "default_model")
      .single()

    const defaultModel = defaultModelData?.setting_value || "gpt-4o-mini"

    // Construir query baseada nas permissões
    let query = (await db.users()).select(`
      id,
      name,
      description,
      status,
      model,
      temperature,
      max_tokens,
      voice_tone,
      main_function,
      created_at,
      updated_at,
      total_conversations,
      total_messages,
      performance_score
    `)

    // Se não for admin ou chave admin, filtrar apenas agentes do usuário
    if (user!.role !== "admin" && !apiKeyData!.is_admin_key) {
      query = query.eq("user_id", user!.id)
    }

    const { data: agents, error } = await query.eq("status", "active").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar agentes:", error)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    // Formatar resposta
    const formattedAgents =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        model: agent.model || defaultModel,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        voice_tone: agent.voice_tone,
        main_function: agent.main_function,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
        stats: {
          total_conversations: agent.total_conversations || 0,
          total_messages: agent.total_messages || 0,
          performance_score: agent.performance_score || 0,
        },
      })) || []

    return NextResponse.json({
      success: true,
      default_model: defaultModel,
      total_agents: formattedAgents.length,
      agents: formattedAgents,
    })
  } catch (error) {
    console.error("Erro na API get-all agents:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
