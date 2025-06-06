import { db } from "@/lib/supabase"
import type { UserProfile } from "@/lib/supabase"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { email, password } = credentials

    // Buscar usuário por email
    const { data: users, error } = await db.users().select("*").eq("email", email.toLowerCase()).eq("status", "active")

    if (error) {
      console.error("Erro ao buscar usuário:", error)
      return { success: false, error: "Erro interno do servidor" }
    }

    if (!users || users.length === 0) {
      return { success: false, error: "Email ou senha incorretos" }
    }

    const user = users[0]

    // Verificar senha (implementação simplificada)
    const bcrypt = require("bcryptjs")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Email ou senha incorretos" }
    }

    // Atualizar último login
    await db.users().update({ last_login_at: new Date().toISOString() }).eq("id", user.id)

    // Remover senha do objeto retornado
    const { password_hash, ...userWithoutPassword } = user

    return { success: true, user: userWithoutPassword }
  } catch (error) {
    console.error("Erro no login:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function registerUser(userData: RegisterData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { email, password, full_name } = userData

    // Verificar se o email já existe
    const { data: existingUsers, error: checkError } = await db.users().select("id").eq("email", email.toLowerCase())

    if (checkError) {
      console.error("Erro ao verificar email:", checkError)
      return { success: false, error: "Erro interno do servidor" }
    }

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Este email já está em uso" }
    }

    // Hash da senha
    const bcrypt = require("bcryptjs")
    const saltRounds = 10
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Criar usuário
    const { data: newUser, error: insertError } = await db
      .users()
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
    await db.userSettings().insert([
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

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db.users().update(updates).eq("id", userId)

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
