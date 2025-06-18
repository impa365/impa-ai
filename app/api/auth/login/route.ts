import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    console.log("🔐 Iniciando processo de login...")

    const { email, password } = await request.json()

    if (!email || !password) {
      console.log("❌ Email ou senha não fornecidos")
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Usar variáveis de ambiente APENAS no servidor (NUNCA no cliente)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Configuração do Supabase não encontrada no servidor")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    console.log("🔗 Conectando ao Supabase no servidor...")

    // Criar cliente Supabase APENAS no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    console.log("🔍 Buscando usuário:", email)

    // Primeiro, vamos tentar buscar na tabela user_profiles (sem .single())
    const { data: userProfiles, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, role, status, password, last_login_at, login_count")
      .eq("email", email.trim().toLowerCase())

    if (fetchError) {
      console.error("❌ Erro ao buscar usuário na user_profiles:", fetchError.message)

      // Se falhar, tentar na tabela users como fallback
      console.log("🔄 Tentando buscar na tabela users...")

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email, full_name, role, is_active, password_hash, created_at")
        .eq("email", email.trim().toLowerCase())

      if (usersError) {
        console.error("❌ Erro ao buscar usuário na users:", usersError.message)
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
      }

      if (!users || users.length === 0) {
        console.log("❌ Usuário não encontrado em nenhuma tabela:", email)
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
      }

      // Usar o primeiro usuário encontrado na tabela users
      const user = users[0]
      console.log("👤 Usuário encontrado na tabela users:", user.email, "Ativo:", user.is_active)

      // Verificar senha hash (se existir)
      if (user.password_hash) {
        // TODO: Implementar verificação de hash bcrypt
        console.log("⚠️ Senha com hash detectada - implementar bcrypt")
        return NextResponse.json({ error: "Sistema de autenticação em manutenção" }, { status: 503 })
      }

      // Se não tiver hash, assumir que é senha em texto plano (temporário)
      console.log("❌ Usuário na tabela users não tem senha em texto plano")
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log("❌ Nenhum usuário encontrado na user_profiles:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (userProfiles.length > 1) {
      console.warn("⚠️ Múltiplos usuários encontrados para o email:", email, "Quantidade:", userProfiles.length)
      // Usar o primeiro usuário ativo encontrado
    }

    // Pegar o primeiro usuário (ou o primeiro ativo)
    let userProfile = userProfiles[0]

    // Se houver múltiplos, tentar pegar o ativo
    if (userProfiles.length > 1) {
      const activeUser = userProfiles.find((u) => u.status === "active")
      if (activeUser) {
        userProfile = activeUser
        console.log("✅ Usuário ativo selecionado entre múltiplos")
      }
    }

    console.log("👤 Usuário selecionado:", userProfile.email, "Status:", userProfile.status)

    // Verificar senha (comparação direta - sem hash por enquanto)
    if (!userProfile.password) {
      console.log("❌ Usuário não tem senha definida:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (userProfile.password !== password) {
      console.log("❌ Senha incorreta para:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Verificar status do usuário
    if (userProfile.status !== "active") {
      console.log("❌ Usuário inativo:", email, "Status:", userProfile.status)
      return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 })
    }

    console.log("✅ Credenciais válidas, atualizando último login...")

    // Atualizar último login
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (userProfile.login_count || 0) + 1,
      })
      .eq("id", userProfile.id)

    if (updateError) {
      console.warn("⚠️ Erro ao atualizar último login:", updateError.message)
      // Não falhar o login por causa disso
    }

    // Preparar dados do usuário para retorno (SEM senha)
    const userData = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      status: userProfile.status,
    }

    console.log("✅ Login realizado com sucesso para:", email)

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
