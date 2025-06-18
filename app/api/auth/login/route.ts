import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Usar variáveis de ambiente apenas no servidor
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing Supabase configuration for login")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Criar cliente Supabase no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    console.log("🔐 Tentativa de login para:", email)

    // Buscar usuário no banco
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("id, email, full_name, role, status, password, last_login_at, login_count")
      .eq("email", email.trim().toLowerCase())
      .single()

    if (fetchError || !userProfile) {
      console.warn("❌ Usuário não encontrado:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar senha (comparação direta - sem hash por enquanto)
    if (!userProfile.password || userProfile.password !== password) {
      console.warn("❌ Senha incorreta para:", email)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar status do usuário
    if (userProfile.status !== "active") {
      console.warn("⚠️ Usuário inativo:", email, "Status:", userProfile.status)
      return NextResponse.json({ error: "Conta inativa. Entre em contato com o suporte." }, { status: 403 })
    }

    // Atualizar último login
    await supabase
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (userProfile.login_count || 0) + 1,
      })
      .eq("id", userProfile.id)

    // Retornar dados do usuário (SEM a senha)
    const userData = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      status: userProfile.status,
    }

    console.log("✅ Login bem-sucedido para:", email)
    return NextResponse.json({ user: userData })
  } catch (error: any) {
    console.error("💥 Erro no login:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
