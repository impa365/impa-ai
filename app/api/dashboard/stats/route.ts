import { NextResponse } from "next/server"
import { getCurrentServerUser } from "@/lib/auth-server"
import { queryMany } from "@/lib/db"

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

    // Buscar agentes do usuário
    const agents = await queryMany('SELECT id FROM ai_agents WHERE user_id = $1', [currentUser.id])

    // Buscar conexões WhatsApp do usuário
    const connections = await queryMany('SELECT id FROM whatsapp_connections WHERE user_id = $1', [currentUser.id])

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
