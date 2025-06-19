// Novo arquivo
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase"
import { getCurrentUserFromSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUserFromSession()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getSupabaseServer()
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, email, role")
      .eq("status", "active") // Apenas usuários ativos
      .order("full_name", { ascending: true })

    if (error) {
      console.error("API Error fetching users for API key:", error.message)
      return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("API Route Error fetching users for API key:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
