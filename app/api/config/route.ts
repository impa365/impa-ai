import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Usar as variáveis de ambiente de runtime (sem NEXT_PUBLIC_)
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nextAuthUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_NEXTAUTH_URL,
    }

    // Log para debug
    console.log("🔧 API Config - Environment variables:")
    console.log("SUPABASE_URL (runtime):", process.env.SUPABASE_URL ? "✅ Defined" : "❌ Not defined")
    console.log("SUPABASE_ANON_KEY (runtime):", process.env.SUPABASE_ANON_KEY ? "✅ Defined" : "❌ Not defined")
    console.log("NEXTAUTH_URL (runtime):", process.env.NEXTAUTH_URL ? "✅ Defined" : "❌ Not defined")

    console.log("🔧 API Config - Final config:")
    console.log("supabaseUrl:", config.supabaseUrl)
    console.log("nextAuthUrl:", config.nextAuthUrl)

    // Verificar se as variáveis essenciais estão definidas
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.error("❌ Missing essential environment variables!")
      return NextResponse.json(
        {
          error: "Missing environment variables",
          details: {
            supabaseUrl: !!config.supabaseUrl,
            supabaseAnonKey: !!config.supabaseAnonKey,
            nextAuthUrl: !!config.nextAuthUrl,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("❌ Error in /api/config:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
