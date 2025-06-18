import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  console.log(`[Middleware] Processando rota: ${pathname}`)

  // Lista de rotas da API que devem ser COMPLETAMENTE públicas (sem verificação de auth)
  const publicApiRoutes = [
    "/api/config", // Configurações públicas do sistema
    "/api/auth/login", // Login - DEVE ser público
    "/api/auth/register", // Registro - DEVE ser público
    "/api/agents/webhook", // Webhooks externos
  ]

  // Lista de páginas públicas (não precisam de autenticação)
  const publicPages = ["/", "/login"]

  // Se for uma rota da API pública, permitir SEMPRE
  if (pathname.startsWith("/api/")) {
    if (publicApiRoutes.includes(pathname)) {
      console.log(`[Middleware] ✅ Permitindo acesso público à API: ${pathname}`)
      return NextResponse.next()
    }

    // Para outras rotas da API, por enquanto vamos permitir também
    // TODO: Implementar verificação de JWT/token para APIs protegidas
    console.log(`[Middleware] ⚠️ Permitindo acesso à API (sem verificação): ${pathname}`)
    return NextResponse.next()
  }

  // Para páginas públicas, permitir acesso
  if (publicPages.includes(pathname)) {
    console.log(`[Middleware] ✅ Permitindo acesso à página pública: ${pathname}`)
    return NextResponse.next()
  }

  // Para outras páginas, por enquanto permitir (TODO: implementar verificação de sessão)
  console.log(`[Middleware] ⚠️ Permitindo acesso à página (sem verificação): ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Corresponder a todas as rotas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - arquivos públicos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
