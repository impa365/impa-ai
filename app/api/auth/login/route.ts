import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Usar variáveis de ambiente apenas no servidor
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Missing Supabase configuration on server")
      return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
    }

    // Criar cliente Supabase no servidor
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "impaai" },
    })

    console.log("🔍 Tentando fazer login para:", email)

    // Buscar usuário no banco de dados
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, password_hash, full_name, role, is_active, created_at")
      .eq("email", email.toLowerCase())
      .single()

    if (userError || !user) {
      console.log("❌ Usuário não encontrado:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Verificar se o usuário está ativo
    if (!user.is_active) {
      console.log("❌ Usuário inativo:", email)
      return NextResponse.json({ error: "Conta desativada. Entre em contato com o administrador." }, { status: 401 })
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log("❌ Senha inválida para:", email)
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    // Login bem-sucedido - remover dados sensíveis
    const userResponse = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    }

    console.log("✅ Login realizado com sucesso para:", email)

    return NextResponse.json({
      user: userResponse,
      message: "Login realizado com sucesso",
    })
  } catch (error: any) {
    console.error("💥 Erro no login:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
