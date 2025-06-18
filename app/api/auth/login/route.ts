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

    console.log("🔗 Conectando ao Supabase:", supabaseUrl)

    // Lista de tabelas possíveis para tentar
    const possibleTables = [
      "user_profiles",
      "users",
      "impaai.user_profiles",
      "impaai.users",
      "public.users",
      "public.user_profiles",
    ]

    let user = null
    let foundTable = null

    // Tentar cada tabela até encontrar o usuário
    for (const table of possibleTables) {
      try {
        console.log(`🔍 Tentando buscar na tabela: ${table}`)

        const userResponse = await fetch(`${supabaseUrl}/rest/v1/${table}?email=eq.${encodeURIComponent(email)}`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        })

        console.log(`📊 Status da resposta para ${table}:`, userResponse.status)

        if (userResponse.ok) {
          const users = await userResponse.json()
          console.log(`👥 Usuários encontrados em ${table}:`, users.length)

          if (users && users.length > 0) {
            user = users[0] // Pegar o primeiro usuário
            foundTable = table
            console.log(`✅ Usuário encontrado na tabela: ${table}`)
            break
          }
        } else {
          console.log(`❌ Erro ${userResponse.status} na tabela ${table}:`, await userResponse.text())
        }
      } catch (error: any) {
        console.log(`⚠️ Erro ao tentar tabela ${table}:`, error.message)
        continue
      }
    }

    if (!user) {
      console.log("❌ Usuário não encontrado em nenhuma tabela")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    console.log("👤 Dados do usuário encontrado:", {
      id: user.id,
      email: user.email,
      table: foundTable,
      hasPassword: !!user.password,
      hasPasswordHash: !!user.password_hash,
      status: user.status || user.is_active,
    })

    // Verificar senha (tentar diferentes campos)
    let isValidPassword = false

    if (user.password_hash) {
      // Senha com hash
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash)
        console.log("🔐 Verificação com bcrypt:", isValidPassword)
      } catch (error: any) {
        console.log("⚠️ Erro no bcrypt:", error.message)
        isValidPassword = false
      }
    } else if (user.password) {
      // Senha em texto plano (temporário)
      isValidPassword = user.password === password
      console.log("🔓 Verificação texto plano:", isValidPassword)
    } else {
      console.log("❌ Usuário sem senha configurada")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (!isValidPassword) {
      console.log("❌ Senha inválida")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Verificar se usuário está ativo
    const isActive = user.status === "active" || user.is_active === true || user.status === null
    if (!isActive) {
      console.log("❌ Usuário inativo:", user.status || user.is_active)
      return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 })
    }

    // Tentar atualizar último login (opcional)
    try {
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/${foundTable}?id=eq.${user.id}`, {
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

      if (updateResponse.ok) {
        console.log("✅ Último login atualizado")
      } else {
        console.log("⚠️ Não foi possível atualizar último login")
      }
    } catch (error: any) {
      console.log("⚠️ Erro ao atualizar último login:", error.message)
    }

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.name,
      role: user.role || "user",
      status: user.status || (user.is_active ? "active" : "inactive"),
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
    console.error("Stack trace:", error.stack)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
