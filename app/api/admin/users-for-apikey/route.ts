import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-config"

export async function GET() {
  try {
    const supabase = getSupabaseServer()

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role")
      .eq("status", "active")
      .order("full_name", { ascending: true })

    if (error) {
      console.error("❌ Error fetching users for API key:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("❌ API Route Error fetching users for API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
