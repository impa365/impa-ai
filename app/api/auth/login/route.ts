import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔐 Iniciando processo de login...")

    const { email, password } = await request.json()

    if (!email || !password) {
      console.log("❌ Email ou senha não fornecidos")
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    console.log("📧 Tentando login para email:", email)

    // Usar fetch direto para o Supabase REST API
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Buscar usuário via REST API do Supabase
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?email=eq.${email}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      console.error("❌ Erro ao buscar usuário:", userResponse.status, userResponse.statusText)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    const users = await userResponse.json()
    console.log("👥 Usuários encontrados:", users.length)

    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Se há múltiplos usuários, pegar o primeiro ativo
    const user = users.find((u: any) => u.status === "active") || users[0]
    console.log("👤 Usuário selecionado:", { id: user.id, email: user.email, role: user.role })

    // Verificar senha
    if (!user.password_hash) {
      console.log("❌ Usuário sem senha configurada")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log("❌ Senha inválida")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Atualizar último login via REST API
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
      }),
    })

    if (!updateResponse.ok) {
      console.warn("⚠️ Não foi possível atualizar último login")
    }

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
      organization_id: user.organization_id,
      created_at: user.created_at,
    }

    console.log("✅ Login realizado com sucesso para:", user.email)

    return NextResponse.json({
      user: userData,
      message: "Login realizado com sucesso",
    })
  } catch (error: any) {
    console.error("💥 Erro crítico no login:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
