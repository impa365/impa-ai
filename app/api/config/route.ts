import { NextResponse } from "next/server"

export async function GET() {
  // Estas variáveis são lidas do ambiente do SERVIDOR no runtime
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  }

  // Log para debug
  console.log("[/api/config] 🔍 Runtime environment variables from server:")
  console.log(`[/api/config] NEXT_PUBLIC_SUPABASE_URL: ${config.supabaseUrl}`)
  console.log(`[/api/config] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${config.supabaseAnonKey ? "***HIDDEN***" : "NOT SET"}`)
  console.log(`[/api/config] NODE_ENV: ${config.nodeEnv}`)

  // Verificar se ainda são placeholders
  if (config.supabaseUrl?.includes("placeholder-build")) {
    console.error("[/api/config] ❌ ERROR: Still serving placeholder URL!")
    return NextResponse.json(
      { error: "Server configuration error: Supabase URL is still a placeholder" },
      { status: 500 },
    )
  }
  if (config.supabaseAnonKey?.includes("placeholder-build")) {
    console.error("[/api/config] ❌ ERROR: Still serving placeholder key!")
    return NextResponse.json(
      { error: "Server configuration error: Supabase key is still a placeholder" },
      { status: 500 },
    )
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error("[/api/config] ❌ ERROR: Missing required configuration")
    return NextResponse.json({ error: "Server configuration error: Missing Supabase credentials" }, { status: 500 })
  }

  console.log("[/api/config] ✅ Serving valid runtime configuration")
  return NextResponse.json(config)
}
