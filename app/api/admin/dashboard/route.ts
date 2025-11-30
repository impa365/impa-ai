import { NextResponse } from "next/server"

export async function GET() {
  try {
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

    // Buscar usuários
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&order=created_at.desc`, {
      headers,
    })

    // Buscar agentes
    const agentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/ai_agents?select=*,user_profiles(email)&order=created_at.desc`,
      {
        headers,
      },
    )

    // Buscar conexões WhatsApp
    const whatsappResponse = await fetch(
      `${supabaseUrl}/rest/v1/whatsapp_connections?select=*,user_profiles(full_name,email)&order=created_at.desc`,
      {
        headers,
      },
    )

    // Buscar integrações
    const integrationsResponse = await fetch(`${supabaseUrl}/rest/v1/integrations?select=*&order=created_at.desc`, {
      headers,
    })

    // Buscar configurações do sistema
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.default_whatsapp_connections_limit`,
      {
        headers,
      },
    )

    // Processar respostas
    const users = usersResponse.ok ? await usersResponse.json() : []
    const agents = agentsResponse.ok ? await agentsResponse.json() : []
    const whatsappConnections = whatsappResponse.ok ? await whatsappResponse.json() : []
    const integrations = integrationsResponse.ok ? await integrationsResponse.json() : []
    const settings = settingsResponse.ok ? await settingsResponse.json() : []

    // Calcular métricas
    const metrics = {
      totalUsers: users.length,
      activeAgents: agents.filter((agent: any) => agent.status === "active").length,
      totalRevenue: 0,
      dailyMessages: 0,
    }

    // Configurações do sistema
    const systemLimits = {
      defaultLimit: settings.length > 0 ? settings[0].setting_value : 2,
    }

    return NextResponse.json({
      users: users.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        last_login: user.last_login_at,
        created_at: user.created_at,
        // NUNCA retornar: password, api_key, preferences
      })),
      agents: agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        user_email: agent.user_profiles?.email,
        created_at: agent.created_at,
      })),
      whatsappConnections: whatsappConnections.map((conn: any) => ({
        id: conn.id,
        connection_name: conn.connection_name,
        instance_name: conn.instance_name,
        status: conn.status,
        user_name: conn.user_profiles?.full_name,
        user_email: conn.user_profiles?.email,
        created_at: conn.created_at,
      })),
      integrations,
      metrics,
      systemLimits,
    })
  } catch (error: any) {
    console.error("💥 Erro ao buscar dados do dashboard:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
