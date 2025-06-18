import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Lista de rotas da API que devem ser públicas
  const publicApiRoutes = [
    "/api/config", // Configurações públicas do sistema
    "/api/auth/login", // Login
    "/api/auth/register", // Registro
    "/api/agents/webhook", // Webhooks
  ]

  // Lista de páginas públicas
  const publicPages = ["/"]

  // Permitir acesso público às rotas da API listadas
  if (pathname.startsWith("/api/")) {
    if (publicApiRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Para outras rotas da API, verificar autenticação
    // Por enquanto, vamos permitir (você pode implementar verificação de token JWT aqui)
    return NextResponse.next()
  }

  // Para páginas, permitir acesso público às listadas
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // Para outras páginas, por enquanto permitir
  // Você pode implementar verificação de sessão aqui
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
