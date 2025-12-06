import { NextResponse, type NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { getCurrentServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação via JWT
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    // Buscar perfil do usuário via REST API
    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=id,full_name,email,role,can_access_agents,can_access_connections,hide_agents_menu,hide_connections_menu,can_view_api_credentials`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Accept-Profile": "impaai",
          "Content-Profile": "impaai",
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro ao buscar perfil:", response.status, errorText)
      return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
    }

    const profiles = await response.json()
    
    if (!profiles || profiles.length === 0) {
      console.error("❌ Perfil não encontrado para user.id:", user.id)
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    const profile = profiles[0]

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error("Erro no handler de perfil:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await request.json()
    const { full_name, email, currentPassword, newPassword, confirmPassword } = userData

    console.log("📝 Atualizando perfil do usuário:", email)

    // Verificar autenticação
    const user = await getCurrentServerUser(request)
    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Validações básicas
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

      // Validações de senha
  if (newPassword) {
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Senhas não coincidem" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Para usuários normais, senha atual é obrigatória
    if (user.role !== "admin" && !currentPassword?.trim()) {
      return NextResponse.json({ error: "Senha atual é obrigatória para alterar a senha" }, { status: 400 })
    }
  }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 })
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "Accept-Profile": "impaai",
      "Content-Profile": "impaai",
    }

    // Preparar dados para atualização
    const updateData: any = {
      full_name: full_name.trim(),
      email: email.trim(),
      updated_at: new Date().toISOString(),
    }

      // Se há nova senha, validar senha atual e fazer o hash
  if (newPassword) {
    // Se não é admin, verificar senha atual
    if (user.role !== "admin") {
      // Buscar senha atual do usuário
      const userResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=password`, {
        headers,
      })

      if (!userResponse.ok) {
        return NextResponse.json({ error: "Erro ao verificar senha atual" }, { status: 500 })
      }

      const userData = await userResponse.json()
      if (!userData || userData.length === 0) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      const currentUserData = userData[0]
      
      // Verificar se a senha atual está correta
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUserData.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
      }
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    updateData.password = hashedPassword
    console.log("🔐 Nova senha hasheada e incluída na atualização")
  }

    // Atualizar usuário no banco
    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro ao atualizar perfil:", errorData)
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: response.status })
    }

    console.log("✅ Perfil atualizado com sucesso para:", email)

    // Retornar dados atualizados (sem senha)
    const safeUserData = {
      id: user.id,
      full_name: updateData.full_name,
      email: updateData.email,
      role: user.role,
      updated_at: updateData.updated_at,
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso!",
      user: safeUserData,
    })
  } catch (error: any) {
    console.error("💥 Erro ao atualizar perfil:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
