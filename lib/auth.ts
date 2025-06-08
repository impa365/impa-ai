import { supabase } from "./supabase"

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Erro de login:", error.message)
    return { user: null, error }
  }

  if (data.user) {
    // Fetch user profile to get full_name and role
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("full_name, role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError.message)
      return { user: null, error: profileError }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profileData?.full_name || data.user.email, // Fallback to email if full_name is null
        role: profileData?.role || "user", // Default role if not found
      },
      error: null,
    }
  }

  return { user: null, error: new Error("Nenhum dado de usuário retornado após o login.") }
}

export async function registerUser({
  email,
  password,
  full_name,
}: { email: string; password: string; full_name: string }) {
  // 1. Registrar o usuário na autenticação do Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name, // Passa o full_name para os metadados do usuário de autenticação
      },
    },
  })

  if (authError) {
    console.error("Erro ao registrar usuário na autenticação:", authError.message)
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "Nenhum usuário retornado após o registro de autenticação." }
  }

  // 2. Inserir o perfil do usuário na tabela 'user_profiles'
  const { error: profileError } = await supabase.from("user_profiles").insert({
    id: authData.user.id, // Usa o ID do usuário recém-criado na autenticação
    full_name: full_name,
    email: email,
    role: "user", // Define o papel padrão como 'user'
  })

  if (profileError) {
    console.error("Erro ao criar perfil do usuário:", profileError.message)
    // Se a criação do perfil falhar, tente reverter o registro de autenticação
    await supabase.auth.admin.deleteUser(authData.user.id) // Requer permissões de admin no Supabase
    return { success: false, error: "Falha ao criar perfil do usuário. Tente novamente." }
  }

  return { success: true, user: { ...authData.user, full_name, role: "user" } }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null // Ensure this runs only on client-side

  const userString = localStorage.getItem("user")
  if (userString) {
    try {
      return JSON.parse(userString)
    } catch (e) {
      console.error("Failed to parse user from localStorage", e)
      return null
    }
  }
  return null
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Erro ao fazer logout:", error.message)
    return { success: false, error: error.message }
  }
  localStorage.removeItem("user")
  return { success: true, error: null }
}
