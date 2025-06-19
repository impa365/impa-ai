import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Usar fetch direto para o Supabase REST API
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Buscar usuário na tabela user_profiles
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      },
    )

    if (!userResponse.ok) {
      // Tentar com função alternativa se a primeira falhar
      const alternativeResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_by_email`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_email: email.trim().toLowerCase() }),
      })

      if (!alternativeResponse.ok) {
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
      }

      const alternativeResult = await alternativeResponse.json()
      if (!alternativeResult || alternativeResult.length === 0) {
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
      }

      const user = alternativeResult[0] || alternativeResult
      return await processLogin(user, password, supabaseUrl, supabaseKey)
    }

    const users = await userResponse.json()

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    const user = users[0]
    return await processLogin(user, password, supabaseUrl, supabaseKey)
  } catch (error: any) {
    // Log apenas no servidor (não visível no cliente)
    console.error("Login error:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função auxiliar para processar o login
async function processLogin(user: any, password: string, supabaseUrl: string, supabaseKey: string) {
  // Verificar senha
  if (!user.password) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
  }

  if (user.password !== password) {
    return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
  }

  // Verificar se usuário está ativo
  if (user.status !== "active") {
    return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 })
  }

  // Atualizar último login (sem logs)
  try {
    await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Accept-Profile": "impaai",
        "Content-Profile": "impaai",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        last_login_at: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }),
    })
  } catch (error: any) {
    // Silencioso - não revelar erros de atualização
  }

  // Retornar dados do usuário (SEM informações confidenciais)
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
  }

  return NextResponse.json({
    user: userData,
    message: "Login realizado com sucesso",
  })
}
