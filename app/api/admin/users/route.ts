import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔍 Buscando usuários via REST API...")

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variáveis de ambiente do Supabase não configuradas")
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar usuários via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&order=created_at.desc`, {
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
      console.error("❌ Erro ao buscar usuários:", response.status, errorData)
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: response.status })
    }

    const users = await response.json()
    console.log("✅ Usuários encontrados:", users.length)

    // Mapear dados para formato seguro (SEM campos sensíveis)
    const safeUsers = users.map((user: any) => ({
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
    }))

    return NextResponse.json({ success: true, users: safeUsers })
  } catch (error: any) {
    console.error("💥 Erro interno ao buscar usuários:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log("👤 Criando novo usuário:", userData.email)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Hash da senha antes de salvar
    let hashedPassword = userData.password
    if (userData.password) {
      const saltRounds = 12
      hashedPassword = await bcrypt.hash(userData.password, saltRounds)
      console.log("🔐 Senha hasheada para novo usuário")
    }

    // Criar usuário via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        full_name: userData.full_name,
        email: userData.email,
        password: hashedPassword, // Agora com hash
        role: userData.role || "user",
        status: userData.status || "active",
        agents_limit: userData.agents_limit || 5,
        connections_limit: userData.connections_limit || 2,
        can_access_agents: userData.can_access_agents ?? true,
        can_access_connections: userData.can_access_connections ?? true,
        hide_agents_menu: userData.hide_agents_menu ?? false,
        hide_connections_menu: userData.hide_connections_menu ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao criar usuário:", errorData)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: response.status })
    }

    const newUser = await response.json()
    console.log("✅ Usuário criado com sucesso:", newUser[0]?.email)

    return NextResponse.json({ user: newUser[0] })
  } catch (error: any) {
    console.error("💥 Erro ao criar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userData = await request.json()
    const { id, ...updateData } = userData

    console.log("✏️ Atualizando usuário:", id)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Se há senha nos dados, fazer hash
    if (updateData.password) {
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(updateData.password, saltRounds)
      updateData.password = hashedPassword
      console.log("🔐 Senha hasheada para atualização")
    }

    // Atualizar usuário via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...updateData,
        updated_at: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao atualizar usuário:", errorData)
      return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: response.status })
    }

    const updatedUser = await response.json()
    console.log("✅ Usuário atualizado com sucesso")

    return NextResponse.json({ user: updatedUser[0] })
  } catch (error: any) {
    console.error("💥 Erro ao atualizar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
    }

    console.log("🗑️ Deletando usuário:", userId)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Deletar usuário via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao deletar usuário:", errorData)
      return NextResponse.json({ error: "Erro ao deletar usuário" }, { status: response.status })
    }

    console.log("✅ Usuário deletado com sucesso")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("💥 Erro ao deletar usuário:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
