import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    console.log("🔍 Buscando usuário específico:", userId)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar usuário específico via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao buscar usuário:", errorData)
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: response.status })
    }

    const users = await response.json()

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const user = users[0]
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
      agents_limit: user.agents_limit || 1, // Usar padrão seguro
      connections_limit: user.connections_limit || 1,
      whatsapp_connections_limit: user.connections_limit || 1,
      login_count: user.login_count || 0,
    }

    return NextResponse.json({ user: safeUser })
  } catch (error: any) {
    console.error("💥 Erro ao buscar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
