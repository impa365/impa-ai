import { NextResponse } from "next/server"
import { queryOne } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    console.log("🔍 Buscando usuário específico:", userId)

    const user = await queryOne(
      `SELECT * FROM user_profiles WHERE id = $1`,
      [userId]
    )

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log("✅ Usuário encontrado:", user.email)

    // Retornar dados seguros (SEM campos sensíveis)
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      agents_limit: user.agents_limit || 5,
      connections_limit: user.connections_limit || 2,
      whatsapp_connections_limit: user.connections_limit || 2,
      login_count: user.login_count || 0,
      can_access_agents: user.can_access_agents ?? true,
      can_access_connections: user.can_access_connections ?? true,
      hide_agents_menu: user.hide_agents_menu ?? false,
      hide_connections_menu: user.hide_connections_menu ?? false,
      can_view_api_credentials: user.can_view_api_credentials ?? false,
    }

    return NextResponse.json({ user: safeUser })
  } catch (error: any) {
    console.error("💥 Erro ao buscar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
