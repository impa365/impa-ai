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

export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Iniciando processo de login para:", email)

    // Usar o método de login do Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("❌ Erro de login na autenticação do Supabase:", authError.message)
      return { user: null, error: authError }
    }

    if (!authData.user) {
      return { user: null, error: new Error("Nenhum dado de usuário retornado após o login.") }
    }

    // Buscar o perfil do usuário na sua tabela customizada (impaai.user_profiles)
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role, status")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("❌ Erro ao buscar perfil do usuário em impaai.user_profiles:", profileError.message)
      // Se o perfil não for encontrado, pode ser um usuário recém-criado ou um problema de sincronização
      // Retornar um erro ou um perfil padrão, dependendo da sua lógica de negócio
      return { user: null, error: new Error("Perfil de usuário não encontrado ou erro ao buscar.") }
    }

    // Atualizar o último login na sua tabela de perfis
    await supabase.from("user_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userProfile.id)

    console.log("✅ Login bem-sucedido!")
    return {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
        status: userProfile.status,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("💥 Erro inesperado no login:", error.message)
    return {
      user: null,
      error: { message: "Erro interno do servidor ao tentar fazer login." },
    }
  }
}

export async function registerUser(userData: RegisterData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { email, password, full_name } = userData

    // 1. Registrar o usuário na autenticação do Supabase
    // Supabase Auth irá lidar com o hashing da senha e a criação do usuário em auth.users
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

    // 2. Inserir o perfil do usuário na tabela 'impaai.user_profiles'
    // Usamos o ID do usuário criado pelo Supabase Auth para manter a sincronia
    const { data: newUserProfile, error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          id: authData.user.id, // ID do usuário do Supabase Auth
          full_name: full_name,
          email: email.toLowerCase(),
          role: "user", // Define o papel padrão como 'user'
          status: "active", // Define o status padrão como 'active'
        },
      ])
      .select()
      .single()

    if (profileError) {
      console.error("Erro ao criar perfil do usuário em impaai.user_profiles:", profileError.message)
      // Se a criação do perfil falhar, tente reverter o registro de autenticação
      // Nota: Deletar usuário via admin API requer uma chave de serviço Supabase,
      // que não deve ser exposta no cliente. Para este ambiente, vamos apenas logar.
      console.warn(
        `Falha ao criar perfil para o usuário ${authData.user.id}. Considere deletar manualmente no Supabase Auth.`,
      )
      return { success: false, error: "Falha ao criar perfil do usuário. Tente novamente." }
    }

    // Criar configurações padrão do usuário (se necessário, como em user_agent_settings)
    // Certifique-se de que esta tabela existe e que os valores padrão estão corretos
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
      console.error("Erro ao criar configurações padrão do usuário:", settingsError.message)
      // Não é um erro crítico para o registro, mas deve ser investigado
    }

    return { success: true, user: newUserProfile }
  } catch (error: any) {
    console.error("Erro inesperado no registro:", error.message)
    return { success: false, error: "Erro interno do servidor ao tentar registrar." }
  }
}

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

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error("Erro ao fazer logout no Supabase:", error.message)
    return { success: false, error: error.message }
  }
  clearCurrentUser()
  return { success: true, error: null }
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
