import { supabase } from "./supabase"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

// Função de login simples, sem hash
export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Iniciando processo de login para:", email)

    // 1. Buscar o usuário na tabela impaai.user_profiles
    const { data: users, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single()

    if (fetchError || !users) {
      console.error("❌ Usuário não encontrado:", fetchError?.message)
      return {
        user: null,
        error: { message: "Credenciais inválidas." },
      }
    }

    const userProfile = users
    console.log("👤 Usuário encontrado:", userProfile.email)

    // 2. Comparar a senha diretamente (sem hash)
    if (!userProfile.password) {
      console.warn(`⚠️ Usuário ${email} não possui senha.`)
      return { user: null, error: { message: "Credenciais inválidas." } }
    }

    if (userProfile.password !== password) {
      console.warn(`❌ Senha incorreta para ${email}`)
      return { user: null, error: { message: "Credenciais inválidas." } }
    }

    // 3. Verificar status do usuário
    if (userProfile.status !== "active") {
      console.warn(`⚠️ Usuário ${email} está inativo. Status: ${userProfile.status}`)
      return { user: null, error: { message: "Sua conta está inativa. Entre em contato com o suporte." } }
    }

    console.log("✅ Login bem-sucedido!")

    const user = {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      status: userProfile.status,
    }

    // 4. Atualizar último login e contador
    await supabase
      .from("user_profiles")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (userProfile.login_count || 0) + 1,
      })
      .eq("id", userProfile.id)

    return { user, error: null }
  } catch (error: any) {
    console.error("💥 Erro no login:", error.message)
    return {
      user: null,
      error: { message: "Erro interno do servidor." },
    }
  }
}

// Função de registro simples, sem hash
export async function registerUser(userData: RegisterData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { email, password, full_name } = userData

    // Validações básicas
    if (!full_name || !email || !password) {
      return { success: false, error: "Todos os campos são obrigatórios." }
    }
    if (password.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: "Email inválido." }
    }

    // 1. Verificar se o email já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())

    if (checkError) {
      console.error("Erro ao verificar email:", checkError)
      return { success: false, error: "Erro interno do servidor." }
    }
    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Este email já está em uso." }
    }

    // 2. Inserir o novo usuário (senha em texto plano)
    const { data: newUserProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert([
        {
          full_name: full_name,
          email: email.toLowerCase(),
          password: password, // Senha em texto plano
          role: "user",
          status: "active",
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao criar usuário:", insertError)
      return { success: false, error: "Erro ao criar conta. Tente novamente." }
    }
    console.log("✅ Usuário criado:", newUserProfile.email)

    // 3. Criar configurações padrão do usuário
    const { error: settingsError } = await supabase.from("user_agent_settings").insert([
      {
        user_id: newUserProfile.id,
        agents_limit: 5,
        transcribe_audio_enabled: true,
        understand_images_enabled: true,
        voice_response_enabled: true,
        calendar_integration_enabled: true,
        vector_store_enabled: true,
      },
    ])

    if (settingsError) {
      console.error("Erro ao criar configurações:", settingsError.message)
    }

    // Remover a senha do objeto retornado por segurança
    const { password: _, ...userWithoutPassword } = newUserProfile

    return { success: true, user: userWithoutPassword }
  } catch (error: any) {
    console.error("💥 Erro no registro:", error.message)
    return { success: false, error: "Erro interno do servidor." }
  }
}

// Funções de gerenciamento de sessão local
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error("Erro ao obter usuário:", error)
    return null
  }
}

export function setCurrentUser(user: UserProfile): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("user", JSON.stringify(user))
  } catch (error) {
    console.error("Erro ao salvar usuário:", error)
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("user")
  } catch (error) {
    console.error("Erro ao limpar usuário:", error)
  }
}

// Função de logout
export async function signOut() {
  console.log("🚪 Realizando logout.")
  clearCurrentUser()
  return { success: true, error: null }
}

// Função de atualização de perfil
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("user_profiles").update(updates).eq("id", userId)
    if (error) {
      console.error("Erro ao atualizar perfil:", error)
      return { success: false, error: "Erro ao atualizar perfil" }
    }
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Função para trocar a senha (simples, sem hash)
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔐 Iniciando troca de senha para usuário:", userId)

    // 1. Buscar o usuário para verificar a senha antiga
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("password")
      .eq("id", userId)
      .single()

    if (fetchError || !userProfile) {
      console.error("Erro ao buscar usuário:", fetchError)
      return { success: false, error: "Usuário não encontrado." }
    }

    console.log("👤 Usuário encontrado, verificando senha antiga...")

    // 2. Verificar a senha antiga (comparação direta)
    if (userProfile.password !== oldPassword) {
      console.warn("❌ Senha antiga incorreta")
      return { success: false, error: "Senha atual incorreta." }
    }

    console.log("✅ Senha antiga verificada, atualizando para nova senha...")

    // 3. Atualizar a senha (texto plano) - CORREÇÃO AQUI
    const { data, error: updateError } = await supabase
      .from("user_profiles")
      .update({ password: newPassword })
      .eq("id", userId)
      .select()

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError)
      return { success: false, error: "Erro ao atualizar a senha: " + updateError.message }
    }

    console.log("✅ Senha atualizada com sucesso!", data)
    return { success: true }
  } catch (error: any) {
    console.error("💥 Erro inesperado ao trocar senha:", error.message)
    return { success: false, error: "Erro interno do servidor: " + error.message }
  }
}
