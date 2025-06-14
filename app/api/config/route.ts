import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Ler APENAS as variáveis de runtime (sem NEXT_PUBLIC_)
    const config = {
      supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    }

    // Log detalhado no servidor para debug
    console.log("📡 Config API Debug:")
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL || "❌ NOT DEFINED")
    console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅ Defined" : "❌ NOT DEFINED")
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "❌ NOT DEFINED")
    console.log("Final config being returned:", {
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
