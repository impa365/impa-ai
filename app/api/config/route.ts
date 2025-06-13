import { NextResponse } from "next/server"

export async function GET() {
  try {
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key",
      nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
    }

    // Log no servidor para debug
    console.log("📡 Config API called:")
    console.log("Supabase URL:", config.supabaseUrl)
    console.log("NextAuth URL:", config.nextAuthUrl)

    return NextResponse.json(config)
  } catch (error) {
    console.error("❌ Error in config API:", error)
    return NextResponse.json({ error: "Failed to load configuration" }, { status: 500 })
  }
}
