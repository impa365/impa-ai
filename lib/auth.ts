import { supabase } from "./supabase"
import bcrypt from "bcryptjs" // Certifique-se de que bcryptjs está instalado: npm install bcryptjs

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

// Função de login manual, sem usar supabase.auth
export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Iniciando processo de login manual para:", email)

    // 1. Buscar o usuário na tabela impaai.user_profiles
    const { data: users, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .single() // Usar single() para esperar um único resultado ou null

    if (fetchError || !users) {
      console.error("❌ Usuário não encontrado ou erro ao buscar:", fetchError?.message)
      return {
        user: null,
        error: { message: "Credenciais inválidas ou usuário inativo." },
      }
    }

    const userProfile = users
    console.log("👤 Usuário encontrado:", userProfile.email)

    // 2. Comparar a senha fornecida com o hash armazenado
    if (!userProfile.password_hash) {
      console.warn(`⚠️ Usuário ${email} não possui password_hash.`)
      return { user: null, error: { message: "Credenciais inválidas." } }
    }

    const passwordMatch = await bcrypt.compare(password, userProfile.password_hash)

    if (!passwordMatch) {
      console.warn(`❌ Senha incorreta para ${email}`)
      return { user: null, error: { message: "Credenciais inválidas." } }
    }

    // 3. Verificar status do usuário
    if (userProfile.status !== "active") {
      console.warn(`⚠️ Usuário ${email} está inativo ou suspenso. Status: ${userProfile.status}`)
      return { user: null, error: { message: "Sua conta está inativa ou suspensa. Entre em contato com o suporte." } }
    }

    console.log("✅ Login manual bem-sucedido!")

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
    console.error("💥 Erro no login manual:", error.message)
    return {
      user: null,
      error: { message: "Erro interno do servidor ao tentar fazer login." },
    }
  }
}

// Função de registro manual, sem usar supabase.auth
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

    // 1. Verificar se o email já existe na tabela impaai.user_profiles
    const { data: existingUsers, error: checkError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())

    if (checkError) {
      console.error("Erro ao verificar email existente:", checkError)
      return { success: false, error: "Erro interno do servidor ao verificar email." }
    }
    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Este email já está em uso." }
    }

    // 2. Hash da senha
    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)
    console.log("🔐 Senha hasheada com sucesso.")

    // 3. Inserir o novo usuário na tabela impaai.user_profiles
    const { data: newUserProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert([
        {
          full_name: full_name,
          email: email.toLowerCase(),
          password_hash: password_hash, // Armazenar o hash da senha
          role: "user", // Papel padrão
          status: "active", // Status padrão
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao criar usuário em impaai.user_profiles:", insertError)
      return { success: false, error: "Erro ao criar conta. Tente novamente." }
    }
    console.log("✅ Usuário inserido em impaai.user_profiles:", newUserProfile.email)

    // 4. Criar configurações padrão do usuário (se a tabela user_agent_settings existir)
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
      console.error("Erro ao criar configurações padrão do usuário (user_agent_settings):", settingsError.message)
      // Este erro não impede o registro, mas deve ser logado
    }

    // Remover o hash da senha do objeto retornado por segurança
    const { password_hash: _, ...userWithoutPassword } = newUserProfile

    return { success: true, user: userWithoutPassword }
  } catch (error: any) {
    console.error("💥 Erro no registro manual:", error.message)
    return { success: false, error: "Erro interno do servidor ao tentar registrar." }
  }
}

// Funções de gerenciamento de sessão local (permanecem as mesmas)
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error("Erro ao obter usuário atual do localStorage:", error)
    return null
  }
}

export function setCurrentUser(user: UserProfile): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("user", JSON.stringify(user))
  } catch (error) {
    console.error("Erro ao salvar usuário no localStorage:", error)
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("user")
  } catch (error) {
    console.error("Erro ao limpar usuário do localStorage:", error)
  }
}

// Função de logout manual (apenas limpa a sessão local)
export async function signOut() {
  console.log("🚪 Realizando logout manual.")
  clearCurrentUser()
  return { success: true, error: null }
}

// Função de atualização de perfil (permanece a mesma, interage com user_profiles)
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

// Função para trocar a senha (nova função)
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Buscar o usuário para verificar a senha antiga
    const { data: userProfile, error: fetchError } = await supabase
      .from("impaai.user_profiles")
      .select("password_hash")
      .eq("id", userId)
      .single()

    if (fetchError || !userProfile) {
      return { success: false, error: "Usuário não encontrado." }
    }

    // 2. Verificar a senha antiga
    const passwordMatch = await bcrypt.compare(oldPassword, userProfile.password_hash)
    if (!passwordMatch) {
      return { success: false, error: "Senha antiga incorreta." }
    }

    // 3. Hash da nova senha
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // 4. Atualizar a senha na tabela user_profiles
    const { error: updateError } = await supabase
      .from("impaai.user_profiles")
      .update({ password_hash: newPasswordHash })
      .eq("id", userId)

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError)
      return { success: false, error: "Erro ao trocar a senha." }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Erro inesperado ao trocar a senha:", error.message)
    return { success: false, error: "Erro interno do servidor." }
  }
}
