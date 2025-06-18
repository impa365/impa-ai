import { type NextRequest, NextResponse } from "next/server"

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

    console.log("🔍 Buscando usuário na tabela impaai.user_profiles...")

    // Buscar usuário na tabela correta: impaai.user_profiles
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    console.log("📊 Status da resposta:", userResponse.status)

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ Erro ao buscar usuário:", userResponse.status, errorText)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    const users = await userResponse.json()
    console.log("👥 Usuários encontrados:", users.length)

    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    const user = users[0] // Pegar o primeiro usuário
    console.log("👤 Dados do usuário:", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
    })

    // Verificar senha (conforme estrutura da tabela, é texto plano)
    if (!user.password) {
      console.log("❌ Usuário sem senha configurada")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (user.password !== password) {
      console.log("❌ Senha incorreta")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Verificar se usuário está ativo
    if (user.status !== "active") {
      console.log("❌ Usuário inativo:", user.status)
      return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 })
    }

    console.log("✅ Credenciais válidas, atualizando último login...")

    // Atualizar último login e contador
    try {
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
          login_count: (user.login_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }),
      })

      if (updateResponse.ok) {
        console.log("✅ Último login atualizado")
      } else {
        console.log("⚠️ Não foi possível atualizar último login")
      }
    } catch (error: any) {
      console.log("⚠️ Erro ao atualizar último login:", error.message)
    }

    // Retornar dados do usuário (SEM SENHA e SEM informações confidenciais)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
      phone: user.phone,
      company: user.company,
      timezone: user.timezone,
      language: user.language,
      email_verified: user.email_verified,
      theme_settings: user.theme_settings,
      agents_limit: user.agents_limit,
      connections_limit: user.connections_limit,
      monthly_messages_limit: user.monthly_messages_limit,
      created_at: user.created_at,
      // NUNCA retornar: password, api_key, bio, preferences
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
