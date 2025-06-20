import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export interface ServerUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  status: "active" | "inactive"
  created_at: string
  updated_at: string
  last_login_at?: string
}

export async function getCurrentServerUser(request?: NextRequest): Promise<ServerUser | null> {
  try {
    // Tentar buscar do cookie primeiro
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("impaai_user")

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        console.log("✅ Usuário encontrado no cookie:", user.email)
        return user as ServerUser
      } catch (error) {
        console.error("❌ Erro ao parsear cookie do usuário:", error)
      }
    }

    // Se não encontrou no cookie, tentar buscar do header Authorization
    if (request) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        // Aqui você pode implementar validação de JWT se necessário
        console.log("🔍 Token encontrado no header:", token.substring(0, 10) + "...")
      }
    }

    console.log("❌ Usuário não encontrado em cookies ou headers")
    return null
  } catch (error) {
    console.error("💥 Erro ao buscar usuário atual:", error)
    return null
  }
}

export async function requireAuth(request?: NextRequest): Promise<ServerUser> {
  const user = await getCurrentServerUser(request)
  if (!user) {
    throw new Error("Usuário não autenticado")
  }
  return user
}

export async function requireAdmin(request?: NextRequest): Promise<ServerUser> {
  const user = await requireAuth(request)
  if (user.role !== "admin") {
    throw new Error("Acesso negado: apenas administradores")
  }
  return user
}
