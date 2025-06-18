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

// Funções de gerenciamento de sessão local (mantidas)
export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    return JSON.parse(userStr) as UserProfile
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

export async function signOut() {
  console.log("🚪 Realizando logout")
  clearCurrentUser()
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
