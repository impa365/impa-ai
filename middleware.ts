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
    "/api/get/agent",
    "/api/get-all/agent",
    "/api/update-lead-follow",
    "/api/get-connection-info",
  ];

  // Lista de páginas públicas
  const publicPages = ["/"];

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
          `🚫 Acesso negado à API ${pathname} - Usuário não autenticado (JWT e API key inválidos)`
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

      console.log(
        `✅ Acesso autorizado à API ${pathname} - Usuário: ${user.email} (${user.role}) via ${authMethod}`
      );
    }

    return NextResponse.next();
  }

  // Se for uma página pública
  if (publicPages.includes(pathname)) {
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
      console.log(`🔄 Redirecionando admin ${user.email} para dashboard admin`);
      const adminUrl = pathname.replace("/dashboard", "/admin");
      return NextResponse.redirect(new URL(adminUrl, req.url));
    }

    console.log(
      `✅ Acesso autorizado à página ${pathname} - Usuário: ${user.email} (${user.role})`
    );
  }

  return NextResponse.next();
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
