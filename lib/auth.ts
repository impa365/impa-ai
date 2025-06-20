// Função para obter usuário atual do localStorage/cookies
export function getCurrentUser() {
  try {
    // Verificar se estamos no lado do cliente
    if (typeof window === "undefined") {
      console.log("⚠️ getCurrentUser chamado no servidor")
      return null
    }

    // Tentar buscar do localStorage primeiro
    const userStr = localStorage.getItem("impaai_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        console.log("✅ Usuário encontrado no localStorage:", user.email)
        return user
      } catch (error) {
        console.error("❌ Erro ao parsear usuário do localStorage:", error)
        localStorage.removeItem("impaai_user")
      }
    }

    // Tentar buscar dos cookies como fallback
    const cookies = document.cookie.split(";")
    const userCookie = cookies.find((cookie) => cookie.trim().startsWith("impaai_user="))

    if (userCookie) {
      try {
        const userValue = userCookie.split("=")[1]
        const user = JSON.parse(decodeURIComponent(userValue))
        console.log("✅ Usuário encontrado nos cookies:", user.email)

        // Sincronizar com localStorage
        localStorage.setItem("impaai_user", JSON.stringify(user))
        return user
      } catch (error) {
        console.error("❌ Erro ao parsear usuário dos cookies:", error)
      }
    }

    console.log("❌ Usuário não encontrado")
    return null
  } catch (error) {
    console.error("💥 Erro ao buscar usuário atual:", error)
    return null
  }
}

// Função para fazer login
export function setCurrentUser(user: any) {
  try {
    console.log("💾 Salvando usuário:", user.email)

    // Salvar no localStorage
    localStorage.setItem("impaai_user", JSON.stringify(user))

    // Salvar nos cookies também (para compatibilidade)
    const expires = new Date()
    expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000) // 24 horas
    document.cookie = `impaai_user=${encodeURIComponent(JSON.stringify(user))}; expires=${expires.toUTCString()}; path=/`

    console.log("✅ Usuário salvo com sucesso")
  } catch (error) {
    console.error("❌ Erro ao salvar usuário:", error)
  }
}

// Função para fazer logout
export function clearCurrentUser() {
  try {
    console.log("🗑️ Removendo usuário")

    // Remover do localStorage
    localStorage.removeItem("impaai_user")

    // Remover dos cookies
    document.cookie = "impaai_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    console.log("✅ Usuário removido com sucesso")
  } catch (error) {
    console.error("❌ Erro ao remover usuário:", error)
  }
}

// Função para verificar se o usuário está logado
export function isAuthenticated(): boolean {
  const user = getCurrentUser()
  return user !== null
}

// Função para verificar se o usuário é admin
export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}
