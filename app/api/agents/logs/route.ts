import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL não está definida")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida")
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o Supabase está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Configuração do Supabase não encontrada" }, { status: 500 })
    }

    const body = await request.json()
    const { agent_id, activity_type, activity_data } = body

    if (!agent_id || !activity_type) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    // Verificar se o agente existe
    const { data: agent, error: agentError } = await db.agents().select("id").eq("id", agent_id).single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agente não encontrado" }, { status: 404 })
    }

    // Registrar log
    const { data, error } = await db.activityLogs().insert([
      {
        agent_id,
        activity_type,
        activity_data: activity_data || {},
      },
    ])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao registrar log:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se o Supabase está configurado
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Configuração do Supabase não encontrada" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const agent_id = searchParams.get("agent_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id é obrigatório" }, { status: 400 })
    }

    // Buscar logs do agente
    const { data, error, count } = await db
      .activityLogs()
      .select("*", { count: "exact" })
      .eq("agent_id", agent_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      logs: data,
      total: count,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("Erro ao buscar logs:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
