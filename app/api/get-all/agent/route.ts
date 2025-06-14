import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/supabase"
import { authenticateApiKey, getDefaultModel, safeParseJson } from "@/lib/api-helpers"
import type { AIAgent } from "@/lib/supabase" // Importando o tipo AIAgent

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req)

  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { userId, isAdmin } = authResult
  const defaultModel = await getDefaultModel()

  try {
    const aiAgentsTable = await db.agents()
    let query = aiAgentsTable.select(
      "id, name, description, status, model, avatar_url, model_config, transcribe_audio, understand_images, voice_response_enabled, calendar_integration, chatnode_integration, orimon_integration",
    )

    if (!isAdmin) {
      if (!userId) {
        // Isso não deveria acontecer se a autenticação passou, mas é uma segurança extra.
        return NextResponse.json({ error: "ID do usuário não encontrado após autenticação." }, { status: 403 })
      }
      query = query.eq("user_id", userId)
    }

    query = query.eq("status", "active") // Por padrão, apenas agentes ativos

    const { data: agents, error: agentsError } = await query

    if (agentsError) {
      console.error("Erro ao buscar agentes:", agentsError.message)
      return NextResponse.json({ error: "Erro ao buscar agentes." }, { status: 500 })
    }

    const simplifiedAgents = agents.map((agent: Partial<AIAgent>) => {
      const modelConfig = safeParseJson(agent.model_config as string | undefined)
      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        model: agent.model || modelConfig?.model || defaultModel || "Não definido",
        avatar_url: agent.avatar_url,
        // Adicionando mais campos para a lista simplificada, conforme necessidade do n8n
        transcribe_audio: agent.transcribe_audio,
        understand_images: agent.understand_images,
        voice_response_enabled: agent.voice_response_enabled,
        calendar_integration: agent.calendar_integration,
        chatnode_integration: agent.chatnode_integration,
        orimon_integration: agent.orimon_integration,
      }
    })

    return NextResponse.json(simplifiedAgents, { status: 200 })
  } catch (error: any) {
    console.error("Erro interno no endpoint /api/get-all/agent:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
