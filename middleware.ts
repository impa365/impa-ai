import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentServerUser } from "./lib/auth-server";
import { validateApiKey } from "./lib/api-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lista de rotas da API que devem ser SEMPRE públicas
  const publicApiRoutes = [
    "/api/config", // Configurações públicas do sistema
    "/api/auth/login", // Login - DEVE ser público
    "/api/auth/register", // Registro
    "/api/auth/logout", // Logout
    "/api/auth/refresh", // Refresh de tokens JWT
    "/api/agents/webhook", // Webhooks (TODO: implementar autenticação específica)
    "/api/system/version", // Versão do sistema
    "/api/integrations/evolution/evolutionBot/create",
    "/api/integrations/evolution/evolutionBot/update",
    "/api/integrations/evolution/evolutionBot/delete",
    "/api/system/settings",
    "/api/admin/branding",
    "/api/whatsapp/shared-links/access", // Links compartilhados - acesso público
    "/api/whatsapp/shared-links/qr-code", // QR Code via links compartilhados - acesso público
    "/api/whatsapp/shared-links/disconnect", // Disconnect via links compartilhados - acesso público
  ];

  // Lista de páginas públicas
  const publicPages = ["/", "/shared/whatsapp", "/auth/login", "/landing", "/demo", "/embed"];

  // Lista de rotas que precisam de role admin
  const adminRoutes = ["/admin", "/api/admin"];

  // Lista de rotas que precisam de autenticação (user ou admin)
  const authRoutes = [
    "/dashboard",
    "/api/user",
    "/api/dashboard",
    "/api/whatsapp",
    "/api/integrations",
    "/api/get",
    "/api/list-leads-follow",
    "/api/add-lead-follow",
    "/api/deactivate-lead-follow",
    "/api/followup-config",
  ];

  // Se for uma rota da API
  if (pathname.startsWith("/api/")) {
    // Verificar se é uma rota pública
    if (publicApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Verificar se precisa de autenticação
    const needsAuth = authRoutes.some((route) => pathname.startsWith(route));
    const needsAdmin = adminRoutes.some((route) => pathname.startsWith(route));

    if (needsAuth || needsAdmin) {
      let user = await getCurrentServerUser(req);
      let authMethod = "jwt";

      // Se não autenticou via JWT, tentar API key
      if (!user) {
        const apiKeyResult = await validateApiKey(req);
        if (apiKeyResult.isValid) {
          user = apiKeyResult.user;
          authMethod = "api_key";
        }
      }

      if (!user) {
        console.log(
          `🚫 Acesso negado à API ${pathname} - Usuário não autenticado`
        );
        return NextResponse.json(
          { error: "Não autorizado - Usuário não autenticado" },
          { status: 401 }
        );
      }

      // Verificar se precisa de role admin
      if (needsAdmin && user.role !== "admin") {
        console.log(
          `🚫 Acesso negado à API ${pathname} - Usuário ${user.email} não é admin`
        );
        return NextResponse.json(
          { error: "Acesso negado - Apenas administradores" },
          { status: 403 }
        );
      }

      // Log de sucesso apenas em ambiente de desenvolvimento
      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ Acesso autorizado à API ${pathname} - Usuário: ${user.email} (${user.role}) via ${authMethod}`
        );
      }
    }

    return NextResponse.next();
  }

  // Se for uma página pública
  if (publicPages.some(page => pathname === page || pathname.startsWith(page + "/"))) {
    return NextResponse.next();
  }

  // Verificar se precisa de autenticação para páginas
  const needsPageAuth = authRoutes.some((route) => pathname.startsWith(route));
  const needsPageAdmin = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (needsPageAuth || needsPageAdmin) {
    const user = await getCurrentServerUser(req);

    if (!user) {
      console.log(
        `🚫 Redirecionando página ${pathname} - Usuário não autenticado`
      );
      const loginUrl = new URL("/", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar se precisa de role admin
    if (needsPageAdmin && user.role !== "admin") {
      console.log(
        `🚫 Redirecionando página ${pathname} - Usuário ${user.email} não é admin`
      );
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirecionar admin para dashboard admin se acessar dashboard comum
    if (pathname.startsWith("/dashboard") && user.role === "admin") {
      const adminUrl = pathname.replace("/dashboard", "/admin");
      return NextResponse.redirect(new URL(adminUrl, req.url));
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ Acesso autorizado à página ${pathname} - Usuário: ${user.email} (${user.role})`
      );
    }
  }

  // Configurar headers especiais para rotas de embed
  const response = NextResponse.next();
  
  // Se for uma rota de embed, permitir iframe de qualquer origem
  if (pathname.startsWith("/embed")) {
    response.headers.set('X-Frame-Options', 'ALLOWALL');
    response.headers.set('Content-Security-Policy', 'frame-ancestors *;');
  }
  
  // Se for rota admin ou dashboard, permitir iframe do mesmo domínio
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' *.impa365.com impa365.com;");
  }

  return response;
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
};
