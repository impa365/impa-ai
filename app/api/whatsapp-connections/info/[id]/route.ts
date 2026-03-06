import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, hasPermission } from "@/lib/auth-utils"
import { queryOne } from "@/lib/db"

/**
 * GET /api/whatsapp-connections/info/[id]
 * Retorna informações básicas de uma conexão WhatsApp (incluindo api_type)
 * Validação de segurança: apenas o dono da conexão ou admin pode acessar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    console.log("📡 API: GET /api/whatsapp-connections/info/[id] chamada para:", connectionId)

    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let currentUser
    try {
      currentUser = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("✅ Usuário autenticado:", currentUser.email, "| Role:", currentUser.role)

    // Buscar conexão do banco
    console.log("🔍 Buscando conexão WhatsApp...")
    const connection = await queryOne<{ id: string; connection_name: string; api_type: string; user_id: string }>(
      'SELECT id, connection_name, api_type, user_id FROM whatsapp_connections WHERE id = $1',
      [connectionId]
    )

    if (!connection) {
      console.error("❌ Conexão não encontrada")
      return NextResponse.json(
        { 
          success: false,
          error: "Conexão não encontrada" 
        }, 
        { status: 404 }
      )
    }
    console.log("✅ Conexão encontrada:", connection.connection_name, "| API Type:", connection.api_type)

    // 🔒 SEGURANÇA: Validar propriedade da conexão
    if (!hasPermission(currentUser.id, connection.user_id, currentUser.role)) {
      console.error("❌ Acesso negado: usuário não é dono nem admin")
      return NextResponse.json(
        { 
          success: false,
          error: "Você não tem permissão para acessar esta conexão" 
        }, 
        { status: 403 }
      )
    }

    console.log("✅ Acesso autorizado:", currentUser.role === "admin" ? "admin" : "owner")

    // Retornar apenas informações básicas (não retornar tokens/senhas)
    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        connection_name: connection.connection_name,
        api_type: connection.api_type || "evolution", // Default para evolution se não tiver
        user_id: connection.user_id,
      },
    })
  } catch (error: any) {
    console.error("❌ Erro na API /api/whatsapp-connections/info/[id]:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

