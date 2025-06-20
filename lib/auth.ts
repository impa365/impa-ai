// Biblioteca de autenticação do cliente
// NUNCA expõe credenciais - apenas gerencia estado local

interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
  last_login_at?: string
}

// Chave para localStorage
const USER_STORAGE_KEY = "impaai_user"

export function getCurrentUser(): User | null {
  try {
    // Verificar se está no browser
    if (typeof window === "undefined") {
      console.log("🔍 getCurrentUser: Executando no servidor, retornando null")
      return null
    }

    // Tentar buscar do localStorage primeiro
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User
        console.log("✅ Usuário encontrado no localStorage:", user.email)
        return user
      } catch (error) {
        console.error("❌ Erro ao parsear usuário do localStorage:", error)
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    }

    // Tentar buscar do cookie como fallback
    const cookies = document.cookie.split(";")
    const userCookie = cookies.find((cookie) => cookie.trim().startsWith(`${USER_STORAGE_KEY}=`))

    if (userCookie) {
      try {
        const cookieValue = userCookie.split("=")[1]
        const decodedValue = decodeURIComponent(cookieValue)
        const user = JSON.parse(decodedValue) as User
        console.log("✅ Usuário encontrado no cookie:", user.email)

        // Sincronizar com localStorage
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
        return user
      } catch (error) {
        console.error("❌ Erro ao parsear usuário do cookie:", error)
      }
    }

    console.log("❌ Usuário não encontrado em localStorage ou cookies")
    return null
  } catch (error) {
    console.error("💥 Erro ao buscar usuário atual:", error)
    return null
  }
}

export function setCurrentUser(user: User): void {
  try {
    console.log("💾 Salvando usuário:", user.email)

    // Salvar no localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

    // Salvar no cookie também para compatibilidade com servidor
    const cookieValue = encodeURIComponent(JSON.stringify(user))
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7) // 7 dias

    document.cookie = `${USER_STORAGE_KEY}=${cookieValue}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`

    console.log("✅ Usuário salvo com sucesso")
  } catch (error) {
    console.error("❌ Erro ao salvar usuário:", error)
  }
}

export function clearCurrentUser(): void {
  try {
    console.log("🗑️ Removendo usuário atual")

    // Remover do localStorage
    localStorage.removeItem(USER_STORAGE_KEY)

    // Remover do cookie
    document.cookie = `${USER_STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`

    console.log("✅ Usuário removido com sucesso")
  } catch (error) {
    console.error("❌ Erro ao remover usuário:", error)
  }
}

export function isAuthenticated(): boolean {
  const user = getCurrentUser()
  const isAuth = user !== null && user.status === "active"
  console.log("🔐 Verificação de autenticação:", isAuth ? "✅ Autenticado" : "❌ Não autenticado")
  return isAuth
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  const isAdminUser = user?.role === "admin"
  console.log("👑 Verificação de admin:", isAdminUser ? "✅ É admin" : "❌ Não é admin")
  return isAdminUser
}

// Função para debug - mostrar estado atual
export function debugAuth(): void {
  console.log("🔍 Debug da autenticação:")
  console.log("- localStorage:", localStorage.getItem(USER_STORAGE_KEY))
  console.log("- cookies:", document.cookie)
  console.log("- usuário atual:", getCurrentUser())
  console.log("- autenticado:", isAuthenticated())
  console.log("- é admin:", isAdmin())
}
