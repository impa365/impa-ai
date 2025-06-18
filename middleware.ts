import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  console.log("🛡️ Middleware verificando rota:", pathname)

  // Lista de rotas da API que devem ser SEMPRE públicas
  const publicApiRoutes = [
    "/api/config", // Configurações públicas do sistema
    "/api/auth/login", // Login - DEVE ser público
    "/api/auth/register", // Registro
    "/api/agents/webhook", // Webhooks
  ]

  // Lista de páginas públicas
  const publicPages = ["/"]

  // Se for uma rota da API
  if (pathname.startsWith("/api/")) {
    // Verificar se é uma rota pública
    if (publicApiRoutes.includes(pathname)) {
      console.log("✅ Rota da API pública permitida:", pathname)
      return NextResponse.next()
    }

    // Para outras rotas da API, por enquanto permitir
    // TODO: Implementar verificação de autenticação JWT aqui
    console.log("⚠️ Rota da API protegida (temporariamente permitida):", pathname)
    return NextResponse.next()
  }

  // Se for uma página pública
  if (publicPages.includes(pathname)) {
    console.log("✅ Página pública permitida:", pathname)
    return NextResponse.next()
  }

  // Para outras páginas, por enquanto permitir
  // TODO: Implementar verificação de sessão aqui
  console.log("⚠️ Página protegida (temporariamente permitida):", pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Corresponder a todas as rotas, exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - /public (arquivos públicos)
     * - /images (se você tiver uma pasta de imagens públicas)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|images).*)",
  ],
}
