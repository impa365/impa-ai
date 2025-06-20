import { publicApi } from "@/lib/api-client"

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

// Função de login usando API
export async function signIn(email: string, password: string) {
  try {
    console.log("🔐 Iniciando login via API para:", email)

    const result = await publicApi.login(email, password)

    if (result.error) {
      console.error("❌ Erro no login:", result.error)
      return {
        user: null,
        error: { message: result.error },
      }
    }

    if (result.data?.user) {
      console.log("✅ Login bem-sucedido via API")
      setCurrentUser(result.data.user)

      // Definir cookie no lado do cliente também (para compatibilidade)
      document.cookie = `impaai_user_client=${JSON.stringify(result.data.user)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

      return {
        user: result.data.user,
        error: null,
      }
    }

    return {
      user: null,
      error: { message: "Resposta inválida do servidor" },
    }
  } catch (error: any) {
    console.error("💥 Erro crítico no login:", error.message)
    return {
      user: null,
      error: { message: "Erro de conexão" },
    }
  }
}

// Função de registro usando API
export async function registerUser(userData: RegisterData) {
  try {
    const result = await publicApi.register(userData)

    if (result.error) {
      return {
        success: false,
        error: result.error,
      }
    }

    return {
      success: true,
      user: result.data?.user,
    }
  } catch (error: any) {
    console.error("💥 Erro no registro:", error.message)
    return {
      success: false,
      error: "Erro de conexão",
    }
  }
}

// Função para trocar a senha via API
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔐 Iniciando troca de senha via API para usuário:", userId)

    // TODO: Implementar API endpoint para mudança de senha
    // const result = await authApi.changePassword(userId, oldPassword, newPassword)

    // Por enquanto, retornar erro informando que precisa ser implementado
    return {
      success: false,
      error: "Funcionalidade de mudança de senha será implementada em breve",
    }
  } catch (error: any) {
    console.error("💥 Erro inesperado ao trocar senha:", error.message)
    return {
      success: false,
      error: "Erro interno do servidor: " + error.message,
    }
  }
}

// Funções de gerenciamento de sessão local (mantidas)
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null

  try {
    // Primeiro, tentar localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr) as UserProfile
      console.log("✅ Usuário encontrado no localStorage:", user.email)
      return user
    }

    // Se não encontrou no localStorage, tentar cookie do cliente
    const cookies = document.cookie.split(";")
    const userCookie = cookies.find((cookie) => cookie.trim().startsWith("impaai_user_client="))

    if (userCookie) {
      const cookieValue = userCookie.split("=")[1]
      if (cookieValue) {
        const user = JSON.parse(decodeURIComponent(cookieValue)) as UserProfile
        console.log("✅ Usuário encontrado no cookie do cliente:", user.email)
        // Sincronizar com localStorage
        localStorage.setItem("user", JSON.stringify(user))
        return user
      }
    }

    console.log("❌ Usuário não encontrado em localStorage nem cookies")
    return null
  } catch (error) {
    console.error("❌ Erro ao obter usuário:", error)
    return null
  }
}

export function setCurrentUser(user: UserProfile): void {
  if (typeof window === "undefined") return

  try {
    // Salvar no localStorage
    localStorage.setItem("user", JSON.stringify(user))

    // Salvar também no cookie do cliente para Docker
    const cookieValue = encodeURIComponent(JSON.stringify(user))
    document.cookie = `impaai_user_client=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax; secure=${window.location.protocol === "https:"}`

    console.log("✅ Usuário salvo no localStorage e cookie:", user.email)
  } catch (error) {
    console.error("❌ Erro ao salvar usuário:", error)
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("user")
    // Limpar cookie também
    document.cookie = "impaai_user_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  } catch (error) {
    console.error("Erro ao limpar usuário:", error)
  }
}

export async function signOut() {
  console.log("🚪 Realizando logout")
  clearCurrentUser()

  // Limpar cookie do servidor também
  try {
    await fetch("/api/auth/logout", { method: "POST" })
  } catch (error) {
    console.error("Erro ao fazer logout no servidor:", error)
  }

  return { success: true, error: null }
}

// Função para verificar se registro público está habilitado
export async function isPublicRegistrationEnabled(): Promise<boolean> {
  try {
    const result = await publicApi.getConfig()
    return result.data?.settings?.allowPublicRegistration || false
  } catch (error) {
    console.error("Erro ao verificar registro público:", error)
    return false
  }
}

// Funções adicionais que podem ser necessárias (mantidas para compatibilidade)
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "email" | "created_at" | "role">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implementar API endpoint para atualização de perfil
    // const result = await authApi.updateProfile(userId, updates)

    return {
      success: false,
      error: "Funcionalidade de atualização de perfil será implementada em breve",
    }
  } catch (error: any) {
    console.error("💥 Erro inesperado ao atualizar perfil:", error.message)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function getUser(): Promise<any | null> {
  // Esta função pode não ser necessária com a nova arquitetura
  // mas mantida para compatibilidade
  return getCurrentUser()
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const user = getCurrentUser()
    return user?.role === "admin" || false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
