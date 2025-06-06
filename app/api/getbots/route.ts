import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("apikey")

    if (!apiKey) {
      return NextResponse.json({ error: "API key é obrigatória" }, { status: 401 })
    }

    // Buscar usuário pela API key
    const { data: user, error: userError } = await db
      .users()
      .select("id, full_name, email")
      .eq("api_key", apiKey)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "API key inválida" }, { status: 401 })
    }

    // Buscar todos os agentes do usuário
    const { data: agents, error: agentsError } = await db
      .agents()
      .select(`
        id,
        name,
        description,
        type,
        status,
        main_function,
        voice_tone,
        created_at,
        updated_at,
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(
          connection_name,
          phone_number,
          status
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (agentsError) {
      console.error("Erro ao buscar agentes:", agentsError)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    // Atualizar último uso da API key
    await db.apiKeys().update({ last_used_at: new Date().toISOString() }).eq("api_key", apiKey)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
      },
      agents: agents || [],
      total: agents?.length || 0,
    })
  } catch (error) {
    console.error("Erro na API getbots:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
