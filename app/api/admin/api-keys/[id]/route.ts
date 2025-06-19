import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ Starting API key deletion for ID:", params.id)

    const user = getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "API Key ID is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase.from("user_api_keys").delete().eq("id", id)

    if (error) {
      console.error("❌ Error deleting API key:", error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    console.log("✅ API key deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error in delete API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
