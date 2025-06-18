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

    // CORREÇÃO: Especificar o schema correto no header
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai", // Especifica o schema correto
          "Content-Profile": "impaai", // Para operações de escrita
        },
      },
    )

    console.log("📊 Status da resposta:", userResponse.status)

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ Erro ao buscar usuário:", userResponse.status, errorText)

      // Se ainda der erro, tentar com URL completa do schema
      console.log("🔄 Tentando com URL alternativa...")

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
        console.error("❌ Erro na busca alternativa também")
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
      }

      const alternativeResult = await alternativeResponse.json()
      if (!alternativeResult || alternativeResult.length === 0) {
        console.log("❌ Usuário não encontrado")
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
      }

      // Usar resultado da função alternativa
      const user = alternativeResult[0] || alternativeResult
      return await processLogin(user, password, supabaseUrl, supabaseKey)
    }

    const users = await userResponse.json()
    console.log("👥 Usuários encontrados:", users.length)

    if (!users || users.length === 0) {
      console.log("❌ Usuário não encontrado")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    const user = users[0]
    return await processLogin(user, password, supabaseUrl, supabaseKey)
  } catch (error: any) {
    console.error("💥 Erro crítico no login:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Função auxiliar para processar o login
async function processLogin(user: any, password: string, supabaseUrl: string, supabaseKey: string) {
  console.log("👤 Processando login para usuário:", {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    hasPassword: !!user.password,
  })

  // Verificar senha
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

  // Atualizar último login
  try {
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
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

    if (updateResponse.ok) {
      console.log("✅ Último login atualizado")
    } else {
      console.log("⚠️ Não foi possível atualizar último login")
    }
  } catch (error: any) {
    console.log("⚠️ Erro ao atualizar último login:", error.message)
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

  console.log("✅ Login realizado com sucesso para:", user.email)

  return NextResponse.json({
    user: userData,
    message: "Login realizado com sucesso",
  })
}
