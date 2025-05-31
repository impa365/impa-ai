import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const agent_id = searchParams.get("agent_id")
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, all

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id é obrigatório" }, { status: 400 })
    }

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await supabase.from("ai_agents").select("id").eq("id", agent_id).single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Definir período de busca
    let startDate = new Date()
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(startDate.getDate() - 90)
        break
      case "all":
        startDate = new Date(0) // Desde o início
        break
    }

    // Buscar logs do agente para estatísticas
    const { data: logs, error: logsError } = await supabase
      .from("agent_activity_logs")
      .select("*")
      .eq("agent_id", agent_id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (logsError) {
      throw logsError
    }

    // Processar estatísticas
    const stats = processStats(logs || [])

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function processStats(logs: any[]) {
  // Total de interações
  const totalInteractions = logs.length

  // Interações por dia
  const dailyInteractions: Record<string, { total: number; success: number }> = {}

  // Tipos de interação
  const interactionTypes: Record<string, number> = {}

  // Tempo médio de resposta
  let totalResponseTime = 0
  let responseTimeCount = 0

  // Taxa de sucesso
  let successCount = 0

  // Perguntas mais frequentes
  const questions: Record<string, number> = {}

  // Processar logs
  logs.forEach((log) => {
    // Processar por dia
    const date = new Date(log.created_at).toISOString().split("T")[0]
    if (!dailyInteractions[date]) {
      dailyInteractions[date] = { total: 0, success: 0 }
    }
    dailyInteractions[date].total++

    // Processar tipo de interação
    const type = log.activity_type || "unknown"
    interactionTypes[type] = (interactionTypes[type] || 0) + 1

    // Processar tempo de resposta
    if (log.activity_data?.response_time) {
      totalResponseTime += log.activity_data.response_time
      responseTimeCount++
    }

    // Processar sucesso
    if (log.activity_data?.success) {
      successCount++
      dailyInteractions[date].success++
    }

    // Processar perguntas
    if (log.activity_data?.question) {
      const question = log.activity_data.question
      questions[question] = (questions[question] || 0) + 1
    }
  })

  // Calcular tempo médio de resposta
  const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0

  // Calcular taxa de sucesso
  const successRate = totalInteractions > 0 ? (successCount / totalInteractions) * 100 : 0

  // Formatar dados diários para array
  const dailyData = Object.keys(dailyInteractions).map((date) => ({
    date,
    interactions: dailyInteractions[date].total,
    successfulInteractions: dailyInteractions[date].success,
  }))

  // Formatar tipos de interação para array
  const interactionTypesArray = Object.keys(interactionTypes).map((type) => ({
    name: type,
    value: interactionTypes[type],
  }))

  // Formatar perguntas mais frequentes para array
  const topQuestions = Object.keys(questions)
    .map((question) => ({ question, count: questions[question] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalInteractions,
    averageResponseTime: Number.parseFloat(averageResponseTime.toFixed(2)),
    successRate: Number.parseFloat(successRate.toFixed(2)),
    dailyInteractions: dailyData,
    interactionTypes: interactionTypesArray,
    topQuestions,
  }
}
