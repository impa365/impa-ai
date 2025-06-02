import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Validar API key
async function validateApiKey(apiKey: string) {
  try {
    const { data, error } = await supabase.from("user_api_keys").select("user_id").eq("api_key", apiKey).single()

    if (error || !data) {
      return null
    }

    // Atualizar last_used_at
    await supabase.from("user_api_keys").update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    return data.user_id
  } catch (error) {
    console.error("Erro ao validar API key:", error)
    return null
  }
}

// GET - Obter lista de todos os bots do usuário
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("apikey")

    if (!apiKey) {
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
      return NextResponse.json(
        {
          success: false,
          error: "API key inválida",
          message: "A API key fornecida não é válida ou não existe",
        },
        { status: 401 },
      )
    }

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
        whatsapp_connections!inner(
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

    // Formatar resposta
    const bots =
      agents?.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        is_default: agent.is_default,
        main_function: agent.main_function,
        whatsapp_connection: {
          name: agent.whatsapp_connections?.connection_name,
          instance: agent.whatsapp_connections?.instance_name,
          status: agent.whatsapp_connections?.status,
        },
        created_at: agent.created_at,
        updated_at: agent.updated_at,
      })) || []

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
