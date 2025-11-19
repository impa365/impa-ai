import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  decodeJWT,
  isTokenExpired,
  extractTokenFromHeader,
} from "@/lib/jwt-edge";

export interface ServerUser {
  id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "user";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export async function getCurrentServerUser(
  request?: NextRequest
): Promise<ServerUser | null> {
  try {
    // PRIORIDADE 1: Tentar JWT do header Authorization
    if (request) {
      const authHeader = request.headers.get("authorization");
      const token = extractTokenFromHeader(authHeader);

      if (token && !isTokenExpired(token)) {
        const jwtPayload = decodeJWT(token);
        if (jwtPayload) {
          console.log(
            "✅ Usuário autenticado via JWT (header):",
            jwtPayload.email
          );

          return {
            id: jwtPayload.id,
            email: jwtPayload.email,
            full_name: jwtPayload.full_name,
            role: jwtPayload.role,
            status: "active", // JWT válido implica usuário ativo
            created_at: "", // Não disponível no JWT
            updated_at: "",
            last_login_at: new Date(jwtPayload.iat! * 1000).toISOString(),
          } as ServerUser;
        }
      }
    }

    // PRIORIDADE 2: Tentar JWT do cookie
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("impaai_access_token");

    if (jwtCookie && !isTokenExpired(jwtCookie.value)) {
      const jwtPayload = decodeJWT(jwtCookie.value);
      if (jwtPayload) {
        console.log(
          "✅ Usuário autenticado via JWT (cookie):",
          jwtPayload.email
        );

        return {
          id: jwtPayload.id,
          email: jwtPayload.email,
          full_name: jwtPayload.full_name,
          role: jwtPayload.role,
          status: "active",
          created_at: "",
          updated_at: "",
          last_login_at: new Date(jwtPayload.iat! * 1000).toISOString(),
        } as ServerUser;
      }
    }

    // ❌ SEM FALLBACK - JWT obrigatório
    console.log("❌ [JWT-AUTH] Nenhum JWT válido encontrado");
    return null;
  } catch (error) {
    console.error("💥 Erro ao buscar usuário atual:", error);
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<ServerUser> {
  const user = await getCurrentServerUser(request);
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  return user;
}

export async function requireAdmin(request?: NextRequest): Promise<ServerUser> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw new Error("Acesso negado: apenas administradores");
  }
  return user;
}
