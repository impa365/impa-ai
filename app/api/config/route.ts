import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Ler configurações das variáveis de ambiente do servidor
    const config = {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      customKey: process.env.CUSTOM_KEY,
    }

    // Log para debug
    console.log("🔧 API Config - Environment variables:")
    console.log("SUPABASE_URL:", config.supabaseUrl ? "✅ Defined" : "❌ Missing")
    console.log("SUPABASE_ANON_KEY:", config.supabaseAnonKey ? "✅ Defined" : "❌ Missing")
    console.log("NEXTAUTH_URL:", config.nextAuthUrl ? "✅ Defined" : "❌ Missing")
    console.log("CUSTOM_KEY:", config.customKey ? "✅ Defined" : "❌ Missing")

    // Verificar se as variáveis essenciais estão definidas
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.error("❌ Missing essential environment variables")
      return NextResponse.json(
        {
          error: "Missing essential environment variables",
          details: {
            supabaseUrl: !!config.supabaseUrl,
            supabaseAnonKey: !!config.supabaseAnonKey,
            nextAuthUrl: !!config.nextAuthUrl,
          },
        },
        { status: 500 },
      )
    }

    // Retornar configurações válidas
    return NextResponse.json(config)
  } catch (error) {
    console.error("❌ Error in config API:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
