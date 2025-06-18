import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    console.log("🔐 [LOGIN API] Iniciando processo de login...")

    const { email, password } = await request.json()

    if (!email || !password) {
      console.log("❌ [LOGIN API] Email ou senha não fornecidos")
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ [LOGIN API] Variáveis de ambiente do Supabase não configuradas")
      console.error("SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ Não configurada")
      console.error("SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Configurada" : "❌ Não configurada")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    console.log("✅ [LOGIN API] Variáveis de ambiente OK, criando cliente Supabase...")

    // Criar cliente Supabase no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    console.log(`🔍 [LOGIN API] Buscando usuário: ${email}`)

    // Buscar usuário na tabela user_profiles (baseado na estrutura que vimos)
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, role, status, password, last_login_at, login_count")
      .eq("email", email.trim().toLowerCase())
      .single()

    if (fetchError) {
      console.error("❌ [LOGIN API] Erro ao buscar usuário:", fetchError.message)
      console.error("❌ [LOGIN API] Detalhes do erro:", fetchError)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (!userProfile) {
      console.log("❌ [LOGIN API] Usuário não encontrado:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    console.log("👤 [LOGIN API] Usuário encontrado:", userProfile.email)

    // Verificar se o usuário está ativo
    if (userProfile.status !== "active") {
      console.log("❌ [LOGIN API] Usuário inativo:", email, "Status:", userProfile.status)
      return NextResponse.json({ error: "Conta desativada. Entre em contato com o administrador." }, { status: 401 })
    }

    // Verificar senha (comparação direta - sem hash por enquanto)
    if (!userProfile.password) {
      console.log("❌ [LOGIN API] Usuário sem senha configurada:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    if (userProfile.password !== password) {
      console.log("❌ [LOGIN API] Senha incorreta para:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    console.log("✅ [LOGIN API] Senha verificada com sucesso!")

    // Atualizar último login (opcional, não bloquear se falhar)
    try {
      await supabase
        .from("user_profiles")
        .update({
          last_login_at: new Date().toISOString(),
          login_count: (userProfile.login_count || 0) + 1,
        })
        .eq("id", userProfile.id)
      console.log("✅ [LOGIN API] Último login atualizado")
    } catch (updateError) {
      console.warn("⚠️ [LOGIN API] Erro ao atualizar último login (não crítico):", updateError)
    }

    // Preparar dados do usuário para retorno (SEM a senha)
    const userData = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      status: userProfile.status,
    }

    console.log("✅ [LOGIN API] Login realizado com sucesso para:", email)

    return NextResponse.json({
      user: userData,
      message: "Login realizado com sucesso",
    })
  } catch (error: any) {
    console.error("💥 [LOGIN API] Erro crítico:", error.message)
    console.error("💥 [LOGIN API] Stack trace:", error.stack)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
