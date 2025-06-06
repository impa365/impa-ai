import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando processo de registro...")

    const body = await request.json()
    console.log("📝 Dados recebidos:", {
      fullName: body.fullName,
      email: body.email,
      hasPassword: !!body.password,
    })

    const { fullName, email, password } = body

    // Validações
    if (!fullName || !email || !password) {
      console.log("❌ Dados obrigatórios faltando")
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Senha muito curta")
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verificar se email já existe
    console.log("🔍 Verificando se email já existe...")
    const { data: existingUser, error: checkError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Erro ao verificar email:", checkError)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    if (existingUser) {
      console.log("❌ Email já existe")
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
    }

    // Hash da senha
    console.log("🔐 Gerando hash da senha...")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Buscar configurações padrão
    console.log("⚙️ Buscando configurações padrão...")
    const { data: defaultLimitSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "max_agents_per_user")
      .single()

    const defaultLimit = defaultLimitSetting?.setting_value || 3

    // Criar usuário
    console.log("👤 Criando usuário no banco...")
    const { data: newUser, error: userError } = await supabase
      .from("user_profiles")
      .insert([
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password_hash: hashedPassword,
          role: "user",
          status: "active",
          agents_limit: defaultLimit,
        },
      ])
      .select()
      .single()

    if (userError) {
      console.error("❌ Erro ao criar usuário:", userError)
      return NextResponse.json({ error: "Erro ao criar usuário: " + userError.message }, { status: 500 })
    }

    console.log("✅ Usuário criado:", newUser.id)

    // Criar configurações do usuário
    console.log("⚙️ Criando configurações do usuário...")
    const { error: settingsError } = await supabase.from("user_agent_settings").insert([
      {
        user_id: newUser.id,
        agents_limit: defaultLimit,
      },
    ])

    if (settingsError) {
      console.error("⚠️ Erro ao criar configurações (não crítico):", settingsError)
    }

    console.log("🎉 Registro concluído com sucesso!")

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("💥 Erro geral no registro:", error)
    return NextResponse.json({ error: "Erro interno do servidor: " + error.message }, { status: 500 })
  }
}
