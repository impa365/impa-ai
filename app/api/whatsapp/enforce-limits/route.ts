import { NextResponse } from "next/server"
import { cookies } from "next/headers"

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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Configuração do banco não encontrada" }, { status: 500 })
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    console.log("🔍 Verificando limites de todos os usuários...")

    // 1. Buscar todos os usuários
    const usersResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?select=id,email,role,connections_limit`,
      { headers }
    )

    if (!usersResponse.ok) {
      return NextResponse.json({ success: false, error: "Erro ao buscar usuários" }, { status: 500 })
    }

    const users = await usersResponse.json()
    const results: any[] = []

    // 2. Para cada usuário, verificar e bloquear conexões excedentes
    for (const user of users) {
      const userLimit = user.role === "admin" ? 999 : (user.connections_limit || 1)

      // Buscar conexões do usuário
      const connectionsResponse = await fetch(
        `${supabaseUrl}/rest/v1/whatsapp_connections?select=id,connection_name,created_at,status&user_id=eq.${user.id}&order=created_at.desc`,
        { headers }
      )

      if (!connectionsResponse.ok) {
        console.error(`Erro ao buscar conexões do usuário ${user.email}`)
        continue
      }

      const connections = await connectionsResponse.json()
      const currentCount = connections.length

      if (currentCount > userLimit) {
        console.log(`⚠️ Usuário ${user.email} (${currentCount}/${userLimit}) - Bloqueando ${currentCount - userLimit} conexões excedentes`)

        // Bloquear as mais recentes (excedentes)
        const connectionsToBlock = connections.slice(0, currentCount - userLimit)
        const blockedIds: string[] = []

        for (const conn of connectionsToBlock) {
          const blockResponse = await fetch(
            `${supabaseUrl}/rest/v1/whatsapp_connections?id=eq.${conn.id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ status: "blocked_limit_exceeded" })
            }
          )

          if (blockResponse.ok) {
            blockedIds.push(conn.id)
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
