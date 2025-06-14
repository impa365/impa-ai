import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Ler variáveis diretamente do ambiente do contêiner (sem NEXT_PUBLIC_ prefix para runtime)
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    }

    // Log detalhado no servidor para debug
    console.log("📡 Config API Debug:")
    console.log("SUPABASE_URL (runtime):", process.env.SUPABASE_URL)
    console.log("NEXT_PUBLIC_SUPABASE_URL (build):", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("SUPABASE_ANON_KEY (runtime):", process.env.SUPABASE_ANON_KEY ? "✅ Defined" : "❌ Missing")
    console.log(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (build):",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Defined" : "❌ Missing",
    )
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
    console.log("Final config:", {
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 20)}...` : "❌ Missing",
      nextAuthUrl: config.nextAuthUrl,
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("❌ Error in config API:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
