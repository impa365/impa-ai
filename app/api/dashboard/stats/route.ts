import { NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function GET() {
  try {
    console.log("🔧 Buscando estatísticas do dashboard do usuário...")

    // Buscar usuário atual usando a nova função
    const currentUser = await getCurrentServerUser()

    if (!currentUser) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", currentUser.email)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar agentes do usuário
    const agentsResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?select=id&user_id=eq.${currentUser.id}`, {
      headers,
    })

    // Buscar conexões WhatsApp do usuário
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=id&user_id=eq.${currentUser.id}`,
      { headers },
    )

    // Processar respostas
    const agents = agentsResponse.ok ? await agentsResponse.json() : []
    const connections = connectionsResponse.ok ? await connectionsResponse.json() : []

    const stats = {
      agentCount: agents.length || 0,
      connectionCount: connections.length || 0,
    }

    console.log("✅ Estatísticas do dashboard carregadas:", stats)

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error("💥 Erro ao buscar estatísticas do dashboard:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
