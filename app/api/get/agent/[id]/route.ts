import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/supabase"
import { authenticateApiKey, getDefaultModel, safeParseJson } from "@/lib/api-helpers"
import type { AIAgent } from "@/lib/supabase"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const agentId = params.id

  if (!agentId) {
    return NextResponse.json({ error: "ID do agente não fornecido." }, { status: 400 })
  }

  const authResult = await authenticateApiKey(req)

  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { userId, isAdmin } = authResult
  const systemDefaultModel = await getDefaultModel()

  try {
    const aiAgentsTable = await db.agents()
    const { data: agent, error: agentError } = await aiAgentsTable
      .select<"*", AIAgent>("*") // Seleciona todas as colunas
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      if (agentError?.code === "PGRST116") {
        // PGRST116: No rows found
        return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 })
      }
      console.error("Erro ao buscar agente específico:", agentError?.message)
      return NextResponse.json({ error: "Erro ao buscar agente." }, { status: 500 })
    }

    // Verificar permissão
    if (!isAdmin && agent.user_id !== userId) {
      return NextResponse.json({ error: "Acesso não autorizado a este agente." }, { status: 403 })
    }

    // Parsear campos JSON
    const modelConfig = safeParseJson(agent.model_config as string | undefined, {})
    const workingHours = safeParseJson(agent.working_hours as string | undefined, {})
    const autoResponses = safeParseJson(agent.auto_responses as string | undefined, {})
    const fallbackResponses = safeParseJson(agent.fallback_responses as string | undefined, {})

    const detailedAgent = {
      ...agent,
      model_config: modelConfig,
      working_hours: workingHours,
      auto_responses: autoResponses,
      fallback_responses: fallbackResponses,
      // Garante que o modelo do agente seja usado, ou o do model_config, ou o padrão do sistema
      model: agent.model || modelConfig?.model || systemDefaultModel || "Não definido",
      system_default_model: systemDefaultModel, // Informa qual é o modelo padrão do sistema
    }

    return NextResponse.json(detailedAgent, { status: 200 })
  } catch (error: any) {
    console.error(`Erro interno no endpoint /api/get/agent/${agentId}:`, error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}
