import { NextResponse } from "next/server"
import { queryMany, queryOne } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔧 Buscando dados do dashboard admin...")

    // Buscar usuários
    const users = await queryMany(
      `SELECT * FROM user_profiles ORDER BY created_at DESC`
    )

    // Buscar agentes com email do usuário (JOIN)
    const agents = await queryMany(
      `SELECT a.*, up.email AS user_email
       FROM ai_agents a
       LEFT JOIN user_profiles up ON a.user_id = up.id
       ORDER BY a.created_at DESC`
    )

    // Buscar conexões WhatsApp com dados do usuário (JOIN)
    const whatsappConnections = await queryMany(
      `SELECT wc.*, up.full_name AS user_full_name, up.email AS user_email
       FROM whatsapp_connections wc
       LEFT JOIN user_profiles up ON wc.user_id = up.id
       ORDER BY wc.created_at DESC`
    )

    // Buscar integrações
    const integrations = await queryMany(
      `SELECT * FROM integrations ORDER BY created_at DESC`
    )

    // Buscar configurações do sistema
    const defaultLimitSetting = await queryOne(
      `SELECT setting_value FROM system_settings WHERE setting_key = $1`,
      ["default_whatsapp_connections_limit"]
    )

    // Calcular métricas
    const metrics = {
      totalUsers: users.length,
      activeAgents: agents.filter((agent: any) => agent.status === "active").length,
      totalRevenue: 0,
      dailyMessages: 0,
    }

    // Configurações do sistema
    const systemLimits = {
      defaultLimit: defaultLimitSetting ? defaultLimitSetting.setting_value : 2,
    }

    console.log("✅ Dados do dashboard carregados")

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
        user_email: agent.user_email,
        created_at: agent.created_at,
      })),
      whatsappConnections: whatsappConnections.map((conn: any) => ({
        id: conn.id,
        connection_name: conn.connection_name,
        instance_name: conn.instance_name,
        status: conn.status,
        user_name: conn.user_full_name,
        user_email: conn.user_email,
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
