import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("🔐 Tentativa de login para:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Configuração do Supabase não encontrada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Buscar usuário por email
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?email=eq.${email}&select=*`, {
      headers,
    })

    if (!userResponse.ok) {
      console.error("❌ Erro ao buscar usuário:", userResponse.status)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    const users = await userResponse.json()

    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const user = users[0]

    // Verificar senha (assumindo que está em texto plano por enquanto)
    if (user.password !== password) {
      console.log("❌ Senha incorreta para:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar se usuário está ativo
    if (user.status !== "active") {
      console.log("❌ Usuário inativo:", email)
      return NextResponse.json({ error: "Conta inativa" }, { status: 401 })
    }

    // Atualizar último login
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
      }),
    })

    if (!updateResponse.ok) {
      console.warn("⚠️ Não foi possível atualizar último login")
    }

    // Preparar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: new Date().toISOString(),
    }

    console.log("✅ Login bem-sucedido para:", email, "- Role:", user.role)

    // Definir cookie com dados do usuário
    const cookieStore = await cookies()
    cookieStore.set("impaai_user", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })

    return NextResponse.json({
      user: userData,
      message: "Login realizado com sucesso",
    })
  } catch (error: any) {
    console.error("💥 Erro crítico no login:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
