import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { queryMany, queryOne } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let user
    try {
      user = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json({ success: false, error: "Usuário não autenticado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", user.email, "ID:", user.id)
    console.log("🔍 Buscando conexões WhatsApp para usuário:", user.email, "ID:", user.id)

    // Buscar conexões do usuário (incluindo api_type)
    const connections = await queryMany(
      `SELECT id, connection_name, instance_name, phone_number, status, api_type,
              created_at, updated_at, last_seen_at, messages_sent, messages_received
       FROM whatsapp_connections
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    )

    // Buscar limites do usuário
    const profile = await queryOne<{ connections_limit: any; role: string }>(
      'SELECT connections_limit, role FROM user_profiles WHERE id = $1',
      [user.id]
    )

    let userLimit = 0 // padrão
    if (profile) {
      // Se for admin, limite ilimitado
      if (profile.role === "admin") {
        userLimit = 999
      }
      // Usar connections_limit se definido
      else if (profile.connections_limit !== undefined && profile.connections_limit !== null) {
        userLimit =
          typeof profile.connections_limit === "string"
            ? Number.parseInt(profile.connections_limit)
            : profile.connections_limit
      }
    }

    console.log(`✅ Encontradas ${connections.length} conexões. Limite: ${userLimit}`)

    // Retornar dados (SEM informações confidenciais)
    return NextResponse.json({
      success: true,
      data: {
        connections: connections.map((conn: any) => ({
          id: conn.id,
          connection_name: conn.connection_name,
          instance_name: conn.instance_name,
          phone_number: conn.phone_number,
          status: conn.status,
          api_type: conn.api_type || "evolution", // CRÍTICO: Incluir api_type
          created_at: conn.created_at,
          updated_at: conn.updated_at,
          last_seen_at: conn.last_seen_at,
          messages_sent: conn.messages_sent || 0,
          messages_received: conn.messages_received || 0,
          // NÃO incluir: instance_token, instance_id, webhook_url, settings
        })),
        limits: {
          current: connections.length,
          maximum: userLimit,
          canCreate: connections.length < userLimit,
        },
      },
    })
  } catch (error: any) {
    console.error("💥 Erro interno ao buscar conexões:", error)
    return NextResponse.json({ success: false, error: `Erro interno: ${error.message}` }, { status: 500 })
  }
}
