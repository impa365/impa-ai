import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

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

// Main signIn function (for compatibility with existing code)
export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Iniciando processo de login para:", email)

    // Verificar se o usuário existe no banco de dados
    const { data: users, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "active")

    if (fetchError || !users || users.length === 0) {
      console.error("❌ Usuário não encontrado ou inativo:", fetchError?.message)
      return {
        user: null,
        error: { message: "Usuário não encontrado ou inativo" },
      }
    }

    const userProfile = users[0]
    console.log("👤 Usuário encontrado:", userProfile.email)

    // Verificar a senha
    if (userProfile.password_hash) {
      console.log("🔍 Verificando senha com hash...")

      // Verificar se a senha está hasheada (começa com $2a$, $2b$, etc.)
      const isHashed = userProfile.password_hash.startsWith("$2")

      let passwordMatch = false

      if (isHashed) {
        // Senha hasheada - usar bcrypt.compare
        passwordMatch = await bcrypt.compare(password, userProfile.password_hash)
        console.log("🔐 Comparação com bcrypt:", passwordMatch ? "✅ Sucesso" : "❌ Falhou")
      } else {
        // Senha em texto plano (usuários antigos) - comparação direta
        passwordMatch = userProfile.password_hash === password
        console.log("📝 Comparação texto plano:", passwordMatch ? "✅ Sucesso" : "❌ Falhou")
      }

      if (passwordMatch) {
        console.log("✅ Login bem-sucedido!")

        const user = {
          id: userProfile.id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          role: userProfile.role,
        }

        // Atualizar último login
        await supabase
          .from("user_profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", userProfile.id)

        return {
          user,
          error: null,
        }
      }
    } else if (!userProfile.password_hash && password === "impa@senha2025") {
      // Fallback para usuários sem senha definida (senha padrão)
      console.warn(`⚠️ Usuário ${email} usando senha padrão`)

      const user = {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
      }

      await supabase.from("user_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userProfile.id)

      return { user, error: null }
    }

    console.warn(`❌ Senha incorreta para ${email}`)
    return {
      user: null,
      error: { message: "Senha incorreta" },
    }
  } catch (error: any) {
    console.error("💥 Erro no login:", error.message)
    return {
      user: null,
      error: { message: "Erro interno do servidor" },
    }
  }
}

// Alternative login function
export async function loginUser(
  credentials: LoginCredentials,
): Promise<{ success: boolean; user?: any; error?: string }> {
  const result = await signIn(credentials.email, credentials.password)

  if (result.error) {
    return { success: false, error: result.error.message }
  }

  return { success: true, user: result.user }
}

export async function registerUser(userData: RegisterData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { email, password, full_name } = userData

    // Verificar se o email já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email.toLowerCase())

    if (checkError) {
      console.error("Erro ao verificar email:", checkError)
      return { success: false, error: "Erro interno do servidor" }
    }

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Este email já está em uso" }
    }

    // Hash da senha
    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Criar usuário
    const { data: newUser, error: insertError } = await supabase
      .from("user_profiles")
      .insert([
        {
          email: email.toLowerCase(),
          password_hash,
          full_name,
          role: "user",
          status: "active",
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao criar usuário:", insertError)
      return { success: false, error: "Erro ao criar conta" }
    }

    // Criar configurações padrão do usuário
    await supabase.from("user_settings").insert([
      {
        user_id: newUser.id,
        agents_limit: 5,
        transcribe_audio_enabled: true,
        understand_images_enabled: true,
        voice_response_enabled: true,
        calendar_integration_enabled: true,
        vector_store_enabled: true,
      },
    ])

    // Remover senha do objeto retornado
    const { password_hash: _, ...userWithoutPassword } = newUser

    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error("Erro no registro:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null

  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    return JSON.parse(userStr)
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error)
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

// For compatibility with existing code
export async function signOut() {
  clearCurrentUser()
}

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
