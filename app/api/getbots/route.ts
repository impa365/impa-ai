import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Validar API key
async function validateApiKey(apiKey: string) {
  try {
    console.log("Validando API key:", apiKey?.substring(0, 10) + "...")

    const { data, error } = await supabase.from("user_api_keys").select("user_id").eq("api_key", apiKey).single()

    console.log("Resultado da validação:", { data, error })

    if (error) {
      console.error("Erro na validação da API key:", error)
      return null
    }

    if (!data) {
      console.log("API key não encontrada")
      return null
    }

    // Atualizar last_used_at
    await supabase.from("user_api_keys").update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    console.log("API key válida para usuário:", data.user_id)
    return data.user_id
  } catch (error) {
    console.error("Erro ao validar API key:", error)
    return null
  }
}

// GET - Obter lista de todos os bots do usuário
export async function GET(request: NextRequest) {
  try {
    console.log("=== Iniciando requisição /api/getbots ===")

    // Tentar múltiplas formas de obter a API key
    const apiKey =
      request.headers.get("apikey") ||
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    console.log("Headers recebidos:", Object.fromEntries(request.headers.entries()))
    console.log("API key extraída:", apiKey?.substring(0, 10) + "...")

    if (!apiKey) {
      console.log("API key não fornecida")
      return NextResponse.json(
        {
          success: false,
          error: "API key é obrigatória",
          message: "Inclua o header 'apikey' na sua requisição",
        },
        { status: 401 },
      )
    }

    // Validar API key
    const userId = await validateApiKey(apiKey)
    if (!userId) {
      console.log("API key inválida ou não encontrada")
      return NextResponse.json(
        {
          success: false,
          error: "API key inválida",
          message: "A API key fornecida não é válida ou não existe",
          debug: {
            apiKeyProvided: !!apiKey,
            apiKeyLength: apiKey?.length,
            apiKeyPrefix: apiKey?.substring(0, 10),
          },
        },
        { status: 401 },
      )
    }

    console.log("Buscando agentes para usuário:", userId)

    // Buscar todos os agentes do usuário
    const { data: agents, error } = await supabase
      .from("ai_agents")
      .select(`
        id,
        name,
        description,
        status,
        is_default,
        main_function,
        created_at,
        updated_at,
        whatsapp_connections(
          connection_name,
          instance_name,
          status
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar agentes:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao buscar agentes",
          message: "Erro interno do servidor ao buscar os agentes",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Agentes encontrados:", agents?.length || 0)

    // Formatar resposta
    const bots =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        is_default: agent.is_default,
        main_function: agent.main_function,
        whatsapp_connection: agent.whatsapp_connections
          ? {
              name: agent.whatsapp_connections.connection_name,
              instance: agent.whatsapp_connections.instance_name,
              status: agent.whatsapp_connections.status,
            }
          : null,
        created_at: agent.created_at,
        updated_at: agent.updated_at,
      })) || []

    console.log("Resposta formatada com", bots.length, "bots")

    return NextResponse.json({
      success: true,
      message: "Bots encontrados com sucesso",
      total: bots.length,
      bots: bots,
    })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        message: "Ocorreu um erro inesperado no servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
