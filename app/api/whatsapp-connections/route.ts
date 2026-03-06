import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { logAccessDenied, logRateLimitExceeded } from "@/lib/security-audit"
import { queryMany } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURANÇA: Autenticar usuário via JWT
    let user
    try {
      user = await requireAuth(request)
    } catch (authError) {
      console.error("❌ Não autorizado:", (authError as Error).message)
      logAccessDenied(undefined, undefined, '/api/whatsapp-connections', request, 'Token JWT inválido ou ausente')
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    // 🔒 RATE LIMITING
    const rateLimit = checkRateLimit(getRequestIdentifier(request, user.id), RATE_LIMITS.READ)
    if (!rateLimit.allowed) {
      console.warn(`⚠️ [RATE-LIMIT] ${user.email} bloqueado por ${rateLimit.retryAfter}s`)
      logRateLimitExceeded(user.id, user.email, '/api/whatsapp-connections', request)
      return NextResponse.json(
        { success: false, error: `Muitas requisições. Aguarde ${rateLimit.retryAfter}s` },
        { status: 429 }
      )
    }

    console.log("✅ Usuário autenticado:", user.email, "| Role:", user.role)

    // 🔒 SEGURANÇA: Admins veem tudo, usuários só suas próprias conexões
    const isAdmin = user.role === "admin"

    let connections: any[]
    try {
      const sql = `
        SELECT wc.*, up.id AS user_profile_id, up.email AS user_profile_email, up.full_name AS user_profile_full_name
        FROM whatsapp_connections wc
        LEFT JOIN user_profiles up ON wc.user_id = up.id
        ${isAdmin ? '' : 'WHERE wc.user_id = $1'}
        ORDER BY wc.connection_name ASC`
      connections = isAdmin ? await queryMany(sql) : await queryMany(sql, [user.id])
    } catch (dbError: any) {
      console.error("[WhatsApp-Connections][ERRO] Falha ao buscar conexões:", {
        userId: user.id,
        isAdmin,
        error: dbError.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao buscar conexões",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    // Filtrar dados sensíveis
    const safeConnections = connections.map((conn: any) => ({
      id: conn.id,
      connection_name: conn.connection_name,
      instance_name: conn.instance_name,
      status: conn.status || "disconnected",
      api_type: conn.api_type || "evolution",
      user_id: conn.user_id,
      phone_number: conn.phone_number,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      user_profiles: conn.user_profile_id ? { id: conn.user_profile_id, email: conn.user_profile_email, full_name: conn.user_profile_full_name } : null,
      settings: conn.settings,
      adciona_folow: conn.adciona_folow,
      remover_folow: conn.remover_folow,
    }))

    return NextResponse.json({
      success: true,
      connections: safeConnections,
    })
  } catch (error: any) {
    // LOG DETALHADO DE EXCEÇÃO
    console.error("[WhatsApp-Connections][EXCEPTION] Erro inesperado ao buscar conexões:", {
      message: error.message,
      stack: error.stack,
      url: request.url,
    })
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
