import { supabase } from "./supabase"
import type { UserProfile } from "./supabase" // Importar o tipo UserProfile

export async function signIn(email: string, password_input: string) {
  // Renomeado para password_input para clareza
  try {
    // Verificar se o usuário existe no banco de dados e buscar o perfil completo
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select<"*", UserProfile>("*") // Especificar o tipo de retorno
      .eq("email", email)
      .eq("status", "active")
      .single()

    if (fetchError || !userProfile) {
      console.error("Erro ao buscar usuário ou usuário não encontrado/inativo:", fetchError?.message)
      return {
        user: null,
        error: { message: "Usuário não encontrado ou inativo" },
      }
    }

    // Verificar a senha
    // ATENÇÃO: Comparando senha em texto plano. NÃO FAÇA ISSO EM PRODUÇÃO!
    if (userProfile.password && userProfile.password === password_input) {
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
    } else if (!userProfile.password && password_input === "impa@senha2025") {
      // Fallback temporário para usuários sem senha definida no banco e usando a senha padrão
      // Este bloco pode ser removido após todos os usuários terem senhas migradas/definidas
      console.warn(`Usuário ${email} logou com senha padrão. Considere definir uma senha no banco.`)
      const user = {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
      }
      await supabase.from("user_profiles").update({ last_login: new Date().toISOString() }).eq("id", userProfile.id)
      return { user, error: null }
    }

    console.warn(`Tentativa de login falhou para ${email}. Senha fornecida não corresponde.`)
    return {
      user: null,
      error: { message: "Senha incorreta" },
    }
  } catch (error: any) {
    console.error("Erro no login:", error.message)
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
