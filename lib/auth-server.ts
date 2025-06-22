import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  verifyAccessToken,
  extractTokenFromHeader,
  logJWTOperation,
} from "@/lib/jwt";

export interface ServerUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
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

      if (token) {
        try {
          const jwtPayload = verifyAccessToken(token);
          console.log(
            "✅ Usuário autenticado via JWT (header):",
            jwtPayload.email
          );
          logJWTOperation(
            "VERIFY",
            jwtPayload.email,
            true,
            "Header Authorization"
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
        } catch (jwtError) {
          console.log(
            "❌ JWT inválido no header:",
            (jwtError as Error).message
          );
          logJWTOperation(
            "VERIFY",
            "unknown",
            false,
            `Header: ${(jwtError as Error).message}`
          );
        }
      }
    }

    // PRIORIDADE 2: Tentar JWT do cookie
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("impaai_access_token");

    if (jwtCookie) {
      try {
        const jwtPayload = verifyAccessToken(jwtCookie.value);
        console.log(
          "✅ Usuário autenticado via JWT (cookie):",
          jwtPayload.email
        );
        logJWTOperation("VERIFY", jwtPayload.email, true, "Cookie JWT");

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
      } catch (jwtError) {
        console.log("❌ JWT inválido no cookie:", (jwtError as Error).message);
        logJWTOperation(
          "VERIFY",
          "unknown",
          false,
          `Cookie: ${(jwtError as Error).message}`
        );
      }
    }

    // PRIORIDADE 3: Fallback para cookie tradicional (compatibilidade)
    const userCookie = cookieStore.get("impaai_user");
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        console.log("✅ Usuário encontrado no cookie tradicional:", user.email);
        return user as ServerUser;
      } catch (error) {
        console.error("❌ Erro ao parsear cookie do usuário:", error);
      }
    }

    console.log("❌ Usuário não encontrado em JWT ou cookies");
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
