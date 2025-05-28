import { supabase } from "./supabase"

export async function signIn(email: string, password: string) {
  try {
    // Verificar se o usuário existe no banco de dados
    const { data: userProfile, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email)
      .eq("status", "active")
      .single()

    if (error || !userProfile) {
      return {
        user: null,
        error: { message: "Usuário não encontrado ou inativo" },
      }
    }

    // Para demonstração, vamos aceitar a senha padrão para todos os usuários
    if (password === "impa@senha2025") {
      const user = {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
      }

      // Atualizar último login
      await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", userProfile.id)

      return {
        user,
        error: null,
      }
    }

    return {
      user: null,
      error: { message: "Senha incorreta" },
    }
  } catch (error) {
    console.error("Erro no login:", error)
    return {
      user: null,
      error: { message: "Erro interno do servidor" },
    }
  }
}

export async function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

export function getCurrentUser() {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
  return null
}
