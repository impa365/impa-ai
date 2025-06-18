import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Crie um cliente Supabase para o middleware.
  // Isso é necessário para ler/escrever cookies de forma segura.
  const supabase = createMiddlewareClient({ req, res })

  // Obtenha a sessão atual.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Lista de rotas da API que devem ser públicas (não exigem autenticação)
  const publicApiRoutes = [
    "/api/auth/register", // Essencial para permitir que novos usuários se cadastrem.
    "/api/agents/webhook", // Webhook para agentes. Deve ter sua própria lógica de autenticação interna.
    // Adicione aqui QUALQUER outra rota da API que precise ser acessível sem login.
    // Ex: /api/password-reset/request
  ]

  // Proteger todas as rotas /api/* por padrão
  if (pathname.startsWith("/api/")) {
    // Se a rota da API não estiver na lista de rotas públicas E não houver sessão
    if (!publicApiRoutes.includes(pathname) && !session) {
      console.warn(`[Middleware] Acesso não autorizado à API: ${pathname} (sem sessão)`)
      return new NextResponse(
        JSON.stringify({ error: "Não autorizado. Você precisa estar logado para acessar este recurso." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      )
    }

    // Se houver sessão, mas a rota for /api/auth/login (usuário já logado tentando acessar login API)
    // Isso é opcional, mas pode ser um bom comportamento.
    if (session && pathname === "/api/auth/login") {
      // Poderia redirecionar ou apenas permitir, dependendo da lógica do seu /api/auth/login
      // Por enquanto, vamos permitir, pois a rota de login pode ter sua própria lógica.
    }
  }

  // Se for uma rota de página (não API) e não houver sessão,
  // redirecionar para a página de login, exceto se já for a página de login.
  const publicPages = ["/"] // A página de login é geralmente a raiz ou /login
  if (!session && !publicPages.includes(pathname) && !pathname.startsWith("/api/")) {
    // Evitar loop de redirecionamento se a página de login for a raiz
    if (pathname !== "/") {
      console.log(`[Middleware] Redirecionando para login: ${pathname} (sem sessão)`)
      const loginUrl = new URL("/", req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Se o usuário estiver logado e tentar acessar a página de login, redirecione para o dashboard apropriado.
  if (session && pathname === "/") {
    const userRole = session.user?.user_metadata?.role || "user" // Adapte conforme sua estrutura de role
    const dashboardUrl = userRole === "admin" ? "/admin" : "/dashboard"
    console.log(`[Middleware] Usuário logado acessando login, redirecionando para: ${dashboardUrl}`)
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Corresponder a todas as rotas, exceto por:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - /public (arquivos públicos)
     * - /images (se você tiver uma pasta de imagens públicas)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|images).*)",
  ],
}
