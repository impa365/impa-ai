import { NextResponse } from "next/server"

export async function GET() {
  // Estas variáveis são lidas do ambiente do SERVIDOR no runtime
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  }

  // Log para debug (remover depois)
  console.log("[/api/config] Serving runtime config:", {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey ? "***HIDDEN***" : "NOT SET",
    nextAuthUrl: config.nextAuthUrl,
    nodeEnv: config.nodeEnv,
  })

  // Verificar se ainda são placeholders
  if (config.supabaseUrl?.includes("placeholder-build")) {
    console.error("[/api/config] ERROR: Still serving placeholder URL!")
  }
  if (config.supabaseAnonKey?.includes("placeholder-build")) {
    console.error("[/api/config] ERROR: Still serving placeholder key!")
  }

  return NextResponse.json(config)
}
