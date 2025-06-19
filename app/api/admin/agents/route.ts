import { NextResponse } from "next/server"

export async function GET() {
  console.log("📡 API: /api/admin/agents chamada")

  try {
    // Usar as variáveis que já existem no projeto
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente não encontradas:", {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      })
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    // Headers para Supabase REST API
    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Buscando agentes...")
    // Buscar agentes com joins
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,user_profiles!ai_agents_user_id_fkey(id,email,full_name),whatsapp_connections!ai_agents_whatsapp_connection_id_fkey(connection_name,status)&order=created_at.desc`,
      { headers },
    )

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text()
      console.error("❌ Erro ao buscar agentes:", agentsResponse.status, errorText)
      throw new Error(`Erro ao buscar agentes: ${agentsResponse.status}`)
    }

    const agents = await agentsResponse.json()
    console.log("✅ Agentes encontrados:", agents.length)

    console.log("🔍 Buscando usuários...")
    // Buscar usuários
    const usersResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=id,email,full_name&order=full_name.asc`,
      { headers },
    )

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text()
      console.error("❌ Erro ao buscar usuários:", usersResponse.status, errorText)
      throw new Error(`Erro ao buscar usuários: ${usersResponse.status}`)
    }

    const users = await usersResponse.json()
    console.log("✅ Usuários encontrados:", users.length)

    console.log("🔍 Buscando conexões WhatsApp...")
    // Buscar conexões WhatsApp
    const connectionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*&order=connection_name.asc`,
      { headers },
    )

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text()
      console.error("❌ Erro ao buscar conexões:", connectionsResponse.status, errorText)
      throw new Error(`Erro ao buscar conexões: ${connectionsResponse.status}`)
    }

    const connections = await connectionsResponse.json()
    console.log("✅ Conexões encontradas:", connections.length)

    console.log("✅ Dados processados com sucesso")
    return NextResponse.json({
      success: true,
      agents: agents || [],
      users: users || [],
      connections: connections || [],
    })
  } catch (error: any) {
    console.error("❌ Erro na API admin/agents:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
