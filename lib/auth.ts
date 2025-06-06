import { supabase } from "./supabase"
import type { UserProfile } from "./supabase"
import bcrypt from "bcryptjs"

export async function signIn(email: string, password_input: string) {
  try {
    console.log("🔐 Iniciando processo de login para:", email)

    // Verificar se o usuário existe no banco de dados e buscar o perfil completo
    const { data: userProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select<"*", UserProfile>("*")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "active")
      .single()

    if (fetchError || !userProfile) {
      console.error("❌ Usuário não encontrado ou inativo:", fetchError?.message)
      return {
        user: null,
        error: { message: "Usuário não encontrado ou inativo" },
      }
    }

    console.log("👤 Usuário encontrado:", userProfile.email)

    // Verificar a senha
    if (userProfile.password_hash) {
      console.log("🔍 Verificando senha com hash...")

      // Verificar se a senha está hasheada (começa com $2a$, $2b$, etc.)
      const isHashed = userProfile.password_hash.startsWith("$2")

      let passwordMatch = false

      if (isHashed) {
        // Senha hasheada - usar bcrypt.compare
        passwordMatch = await bcrypt.compare(password_input, userProfile.password_hash)
        console.log("🔐 Comparação com bcrypt:", passwordMatch ? "✅ Sucesso" : "❌ Falhou")
      } else {
        // Senha em texto plano (usuários antigos) - comparação direta
        passwordMatch = userProfile.password_hash === password_input
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
    } else if (!userProfile.password_hash && password_input === "impa@senha2025") {
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
