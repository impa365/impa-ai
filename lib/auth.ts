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
    console.log("🔐 Iniciando troca de senha para usuário:", userId)

    // Fazer chamada para o endpoint de mudança de senha administrativo
    const response = await fetch("/api/admin/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: userId,
        password: newPassword, // A API fará o hash
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Erro ao alterar senha")
    }

    console.log("✅ Senha alterada com sucesso")
    return {
      success: true,
    }
  } catch (error: any) {
    console.error("💥 Erro ao trocar senha:", error.message)
    return {
      success: false,
      error: error.message || "Erro interno do servidor",
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
      try {
        const user = JSON.parse(userStr) as UserProfile
        
        // Validar se o objeto user tem as propriedades essenciais
        if (!user.id || !user.email || !user.role) {
          console.warn("⚠️ Dados de usuário incompletos no localStorage, removendo...");
          localStorage.removeItem("user");
          throw new Error("Dados de usuário incompletos");
        }
        
        console.log("✅ Usuário encontrado no localStorage:", user.email)
        return user
      } catch (parseError) {
        console.warn("🗑️ Dados corrompidos no localStorage, limpando...");
        localStorage.removeItem("user");
      }
    }

    // Se não encontrou no localStorage, tentar cookie do cliente
    const cookies = document.cookie.split(";")
    const userCookie = cookies.find((cookie) => cookie.trim().startsWith("impaai_user_client="))

    if (userCookie) {
      const cookieValue = userCookie.split("=")[1]
      if (cookieValue) {
        try {
          const user = JSON.parse(decodeURIComponent(cookieValue)) as UserProfile
          
          // Validar se o objeto user tem as propriedades essenciais
          if (!user.id || !user.email || !user.role) {
            console.warn("⚠️ Dados de usuário incompletos no cookie, removendo...");
            document.cookie = "impaai_user_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            throw new Error("Dados de usuário incompletos");
          }
          
          console.log("✅ Usuário encontrado no cookie do cliente:", user.email)
          // Sincronizar com localStorage
          localStorage.setItem("user", JSON.stringify(user))
          return user
        } catch (parseError) {
          console.warn("🗑️ Cookie corrompido, limpando...");
          document.cookie = "impaai_user_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
    }

    console.log("❌ Usuário não encontrado em localStorage nem cookies")
    return null
  } catch (error) {
    console.error("❌ Erro ao obter usuário:", error)
    // Em caso de erro crítico, limpar tudo
    try {
      localStorage.removeItem("user");
      document.cookie = "impaai_user_client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (cleanupError) {
      console.error("❌ Erro ao limpar dados corrompidos:", cleanupError);
    }
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
    // Limpar localStorage
    localStorage.removeItem("user")
    
    // Limpar TODOS os cookies de autenticação
    const cookiesToDelete = [
      "impaai_user_client",
      "impaai_access_token",
      "impaai_refresh_token",
      "impaai_user"
    ]
    
    cookiesToDelete.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      // Também tentar deletar com domínio específico (caso exista)
      if (window.location.hostname !== "localhost") {
        document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
    
    console.log("🗑️ LocalStorage e cookies limpos")
  } catch (error) {
    console.error("Erro ao limpar usuário:", error)
  }
}

export async function signOut() {
  console.log("🚪 Realizando logout")
  
  // Limpar cookie do servidor PRIMEIRO
  try {
    await fetch("/api/auth/logout", { method: "POST" })
    console.log("✅ Logout no servidor realizado")
  } catch (error) {
    console.error("Erro ao fazer logout no servidor:", error)
  }
  
  // Depois limpar dados do cliente
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
