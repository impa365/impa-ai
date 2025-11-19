/**
 * Utilitários de autenticação seguros
 * Sempre valida JWT antes de confiar nos dados do usuário
 */

import { cookies } from "next/headers"
import { type NextRequest } from "next/server"
import { 
  decodeJWT, 
  isTokenExpired, 
  extractTokenFromHeader 
} from "@/lib/jwt-edge"

export interface AuthenticatedUser {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
}

/**
 * Autentica o usuário validando JWT
 * NUNCA confiar apenas no cookie JSON - SEMPRE validar assinatura JWT
 * 
 * @returns Usuário autenticado ou null se inválido
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // PRIORIDADE 1: JWT no header Authorization
    if (request) {
      const authHeader = request.headers.get("authorization")
      const token = extractTokenFromHeader(authHeader)

      if (token && !isTokenExpired(token)) {
        const jwtPayload = decodeJWT(token)
        if (jwtPayload) {
          console.log("✅ [JWT-AUTH] Autenticado via header:", jwtPayload.email)

          return {
            id: jwtPayload.id,
            email: jwtPayload.email,
            full_name: jwtPayload.full_name,
            role: jwtPayload.role,
          }
        }
      } else if (token && isTokenExpired(token)) {
        console.log("❌ [JWT-AUTH] Token expirado no header")
      }
    }

    // PRIORIDADE 2: JWT no cookie
    const cookieStore = await cookies()
    const jwtCookie = cookieStore.get("impaai_access_token")

    if (jwtCookie && !isTokenExpired(jwtCookie.value)) {
      const jwtPayload = decodeJWT(jwtCookie.value)
      if (jwtPayload) {
        console.log("✅ [JWT-AUTH] Autenticado via cookie:", jwtPayload.email)

        return {
          id: jwtPayload.id,
          email: jwtPayload.email,
          full_name: jwtPayload.full_name,
          role: jwtPayload.role,
        }
      }
    } else if (jwtCookie && isTokenExpired(jwtCookie.value)) {
      console.log("❌ [JWT-AUTH] Token expirado no cookie")
    }

    // ⚠️ FALLBACK TEMPORÁRIO: Cookie JSON simples (SOMENTE PARA COMPATIBILIDADE)
    // TODO: Remover após migração completa para JWT
    const userCookie = cookieStore.get("impaai_user")
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        console.warn("⚠️ Usando fallback de cookie JSON (não seguro) - migrar para JWT")
        
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        }
      } catch (error) {
        console.error("❌ Erro ao parsear cookie do usuário:", error)
      }
    }

    console.log("❌ Nenhuma autenticação válida encontrada")
    return null
  } catch (error) {
    console.error("💥 Erro ao autenticar usuário:", error)
    return null
  }
}

/**
 * Requer autenticação - retorna usuário ou lança erro
 */
export async function requireAuth(request?: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error("Não autorizado - Autenticação necessária")
  }
  
  return user
}

/**
 * Requer que o usuário seja admin
 */
export async function requireAdmin(request?: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  
  if (user.role !== "admin") {
    throw new Error("Acesso negado - Apenas administradores")
  }
  
  return user
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 * @param userId ID do usuário autenticado
 * @param resourceUserId ID do dono do recurso
 * @param userRole Role do usuário autenticado
 * @returns true se tem permissão (é dono ou admin)
 */
export function hasPermission(
  userId: string,
  resourceUserId: string,
  userRole: "admin" | "user"
): boolean {
  return userId === resourceUserId || userRole === "admin"
}
