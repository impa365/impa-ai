import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  console.log("📡 API: /api/auth/login chamada")

  try {
    const { email, password } = await request.json()
    console.log("🔐 Tentativa de login para:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas")
    }

    const headers = {
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    // Buscar usuário no banco
    console.log("🔍 Buscando usuário no banco de dados...")
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*&email=eq.${email}`, { headers })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ Erro ao buscar usuário:", userResponse.status, errorText)
      throw new Error("Erro ao buscar usuário")
    }

    const users = await userResponse.json()
    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    const user = users[0]
    console.log("✅ Usuário encontrado:", user.email)

    // Verificar senha (assumindo que está em texto plano por enquanto)
    if (user.password !== password) {
      console.log("❌ Senha incorreta para:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar se usuário está ativo
    if (user.status !== "active") {
      console.log("❌ Usuário inativo:", email)
      return NextResponse.json({ error: "Usuário inativo" }, { status: 401 })
    }

    // Atualizar último login
    console.log("📝 Atualizando último login...")
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
      }),
    })

    if (!updateResponse.ok) {
      console.warn("⚠️ Falha ao atualizar último login")
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

    console.log("✅ Login realizado com sucesso:", userData.email)

    // Definir cookie
    const cookieStore = await cookies()
    cookieStore.set("impaai_user", JSON.stringify(userData), {
      httpOnly: false, // Permitir acesso via JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error: any) {
    console.error("❌ Erro no login:", error.message)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
