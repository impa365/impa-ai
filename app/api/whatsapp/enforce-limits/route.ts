import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query, queryMany } from "@/lib/db"

/**
 * Endpoint para forçar limites de conexões
 * Bloqueia conexões excedentes de todos os usuários
 */
export async function POST() {
  try {
    // Verificar se é admin
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (!userCookie) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    let currentUser
    try {
      currentUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é admin
    if (currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Apenas administradores podem executar esta ação" }, { status: 403 })
    }

    console.log("🔍 Verificando limites de todos os usuários...")

    // 1. Buscar todos os usuários
    const users = await queryMany<{ id: string; email: string; role: string; connections_limit: number }>(
      `SELECT id, email, role, connections_limit FROM user_profiles`
    )

    const results: any[] = []

    // 2. Para cada usuário, verificar e bloquear conexões excedentes
    for (const user of users) {
      const userLimit = user.role === "admin" ? 999 : (user.connections_limit || 1)

      // Buscar conexões do usuário
      const connections = await queryMany<{ id: string; connection_name: string; created_at: string; status: string }>(
        `SELECT id, connection_name, created_at, status FROM whatsapp_connections WHERE user_id = $1 ORDER BY created_at DESC`,
        [user.id]
      )

      const currentCount = connections.length

      if (currentCount > userLimit) {
        console.log(`⚠️ Usuário ${user.email} (${currentCount}/${userLimit}) - Bloqueando ${currentCount - userLimit} conexões excedentes`)

        // Bloquear as mais recentes (excedentes)
        const connectionsToBlock = connections.slice(0, currentCount - userLimit)
        const blockedIds: string[] = []

        for (const conn of connectionsToBlock) {
          try {
            await query(
              `UPDATE whatsapp_connections SET status = $1 WHERE id = $2`,
              ["blocked_limit_exceeded", conn.id]
            )
            blockedIds.push(conn.id)
          } catch (err) {
            console.error(`Erro ao bloquear conexão ${conn.id}:`, err)
          }
        }

        results.push({
          userId: user.id,
          email: user.email,
          limit: userLimit,
          totalConnections: currentCount,
          blocked: blockedIds.length,
          blockedIds
        })
      } else {
        console.log(`✅ Usuário ${user.email} (${currentCount}/${userLimit}) - OK`)
      }
    }

    console.log(`✅ Verificação completa: ${results.length} usuários com conexões bloqueadas`)

    return NextResponse.json({
      success: true,
      message: `Verificação completa. ${results.length} usuário(s) com conexões bloqueadas.`,
      results
    })
  } catch (error: any) {
    console.error("❌ Erro ao forçar limites:", error)
    return NextResponse.json(
      { success: false, error: `Erro interno: ${error.message}` },
      { status: 500 }
    )
  }
}
