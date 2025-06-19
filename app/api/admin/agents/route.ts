import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    console.log("📡 [API] Buscando dados dos agentes...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar agentes com relacionamentos
    const { data: agents, error: agentsError } = await supabase
      .from("ai_agents")
      .select(`
        *,
        user_profiles!ai_agents_user_id_fkey (
          id,
          email,
          full_name
        ),
        whatsapp_connections!ai_agents_whatsapp_connection_id_fkey (
          id,
          connection_name,
          instance_name
        )
      `)
      .order("created_at", { ascending: false })

    if (agentsError) {
      console.error("❌ Erro ao buscar agentes:", agentsError)
      return NextResponse.json({ error: "Erro ao buscar agentes" }, { status: 500 })
    }

    // Buscar usuários
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, role")
      .order("full_name")

    if (usersError) {
      console.error("❌ Erro ao buscar usuários:", usersError)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }

    // Buscar conexões WhatsApp
    const { data: connections, error: connectionsError } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .order("connection_name")

    if (connectionsError) {
      console.error("❌ Erro ao buscar conexões:", connectionsError)
      return NextResponse.json({ error: "Erro ao buscar conexões" }, { status: 500 })
    }

    console.log("✅ Dados carregados:", {
      agents: agents?.length || 0,
      users: users?.length || 0,
      connections: connections?.length || 0,
    })

    return NextResponse.json({
      agents: agents || [],
      users: users || [],
      connections: connections || [],
    })
  } catch (error) {
    console.error("💥 Erro interno na API:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 [API] Criando agente:", body.name)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: agent, error } = await supabase.from("ai_agents").insert([body]).select().single()

    if (error) {
      console.error("❌ Erro ao criar agente:", error)
      return NextResponse.json({ error: "Erro ao criar agente" }, { status: 500 })
    }

    console.log("✅ Agente criado:", agent.id)
    return NextResponse.json({ agent })
  } catch (error) {
    console.error("💥 Erro ao criar agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    console.log("📝 [API] Atualizando agente:", id)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: agent, error } = await supabase.from("ai_agents").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("❌ Erro ao atualizar agente:", error)
      return NextResponse.json({ error: "Erro ao atualizar agente" }, { status: 500 })
    }

    console.log("✅ Agente atualizado:", agent.id)
    return NextResponse.json({ agent })
  } catch (error) {
    console.error("💥 Erro ao atualizar agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do agente é obrigatório" }, { status: 400 })
    }

    console.log("🗑️ [API] Deletando agente:", id)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from("ai_agents").delete().eq("id", id)

    if (error) {
      console.error("❌ Erro ao deletar agente:", error)
      return NextResponse.json({ error: "Erro ao deletar agente" }, { status: 500 })
    }

    console.log("✅ Agente deletado:", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("💥 Erro ao deletar agente:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
