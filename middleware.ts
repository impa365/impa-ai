import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log das variáveis de ambiente no middleware (apenas para debug)
  if (request.nextUrl.pathname === "/api/config") {
    console.log("🔧 Middleware - Environment check:")
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing")
    console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing")
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
