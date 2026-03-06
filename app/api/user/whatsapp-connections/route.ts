import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { queryMany } from "@/lib/db"

export async function GET(request: NextRequest) {
  console.log("📡 API: GET /api/user/whatsapp-connections chamada")

  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", currentUser.email)

    // Buscar apenas conexões do usuário logado
    const connections = await queryMany(
      `SELECT id, connection_name, instance_name, status, api_type, user_id, phone_number,
              created_at, updated_at, settings, adciona_folow, remover_folow
       FROM whatsapp_connections
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [currentUser.id]
    )

    // Garantir que api_type sempre existe (fallback para "evolution")
    const safeConnections = connections.map((conn: any) => ({
      ...conn,
      api_type: conn.api_type || "evolution",
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    console.error("❌ Erro na API user/whatsapp-connections:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
