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

    // Buscar usuário na tabela user_profiles (conforme estrutura do sistema)
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, role, status, password, last_login_at, login_count")
      .eq("email", email.trim().toLowerCase())
      .single()

    if (fetchError) {
      console.error("❌ Erro ao buscar usuário:", fetchError.message)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (!userProfile) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    console.log("👤 Usuário encontrado:", userProfile.email, "Status:", userProfile.status)

    // Verificar senha (comparação direta - sem hash por enquanto)
    if (!userProfile.password || userProfile.password !== password) {
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
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
